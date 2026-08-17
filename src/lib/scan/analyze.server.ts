import {
  scoreFromChecks,
  verdictFromScore,
  type ScanCheck,
  type ScanMeta,
  type ScanResult,
} from "./types";

const MAX_BYTES = 700_000;
const TIMEOUT_MS = 12_000;
const UA =
  "Mozilla/5.0 (compatible; LimeSafeGuardBot/1.0; +https://lime-safeguard.lovable.app)";

const PRIVATE_HOST =
  /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|.+\.local|.+\.internal|.+\.localhost)$/i;

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (PRIVATE_HOST.test(h)) return true;
  // raw IP literals are never legitimate shops
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return true;
  if (h.startsWith("[")) return true;
  return false;
}

function registrableDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./i, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  const secondLevel = new Set(["co", "com", "org", "net", "gov", "ac"]);
  const last = parts[parts.length - 1]!;
  const secondLast = parts[parts.length - 2]!;
  if (last.length === 2 && secondLevel.has(secondLast)) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

interface FetchOutcome {
  ok: boolean;
  status?: number;
  finalUrl?: string;
  html?: string;
  redirects: string[];
  responseMs: number;
  error?: string;
  httpsWorks: boolean;
}

async function fetchPage(startUrl: string): Promise<FetchOutcome> {
  const redirects: string[] = [];
  let current = startUrl;
  const started = Date.now();
  let httpsWorks = false;

  for (let hop = 0; hop < 6; hop++) {
    const url = new URL(current);
    if (isBlockedHost(url.hostname)) {
      return {
        ok: false,
        redirects,
        responseMs: Date.now() - started,
        error: "Diese Adresse zeigt auf ein internes oder privates Netzwerk.",
        httpsWorks,
      };
    }
    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        headers: {
          "user-agent": UA,
          accept: "text/html,application/xhtml+xml",
          "accept-language": "de-DE,de;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      if (url.protocol === "https:" && hop === 0) {
        // retry over http to distinguish "offline" from "no valid TLS"
        current = current.replace(/^https:/, "http:");
        redirects.push(current);
        continue;
      }
      return {
        ok: false,
        redirects,
        responseMs: Date.now() - started,
        error:
          error instanceof Error && error.name === "TimeoutError"
            ? "Die Seite hat nicht innerhalb von 12 Sekunden geantwortet."
            : "Die Seite konnte nicht geladen werden (DNS, Zertifikat oder Server-Fehler).",
        httpsWorks,
      };
    }

    if (url.protocol === "https:") httpsWorks = true;

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        return {
          ok: false,
          status: response.status,
          finalUrl: current,
          redirects,
          responseMs: Date.now() - started,
          error: "Weiterleitung ohne Ziel.",
          httpsWorks,
        };
      }
      current = new URL(location, current).toString();
      redirects.push(current);
      continue;
    }

    const reader = response.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder("utf-8");
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        html += decoder.decode(value, { stream: true });
        if (received > MAX_BYTES) {
          await reader.cancel();
          break;
        }
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      finalUrl: current,
      html,
      redirects,
      responseMs: Date.now() - started,
      httpsWorks,
    };
  }

  return {
    ok: false,
    redirects,
    responseMs: Date.now() - started,
    error: "Zu viele Weiterleitungen.",
    httpsWorks,
  };
}

interface RdapInfo {
  registrationDate: string | null;
  registrar: string | null;
  available: boolean;
}

async function lookupRdap(domain: string): Promise<RdapInfo> {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { accept: "application/rdap+json" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (!response.ok) return { registrationDate: null, registrar: null, available: false };
    const data = (await response.json()) as {
      events?: { eventAction?: string; eventDate?: string }[];
      entities?: { roles?: string[]; vcardArray?: unknown }[];
    };
    const registration =
      data.events?.find((e) =>
        ["registration", "created", "last changed"].includes(e.eventAction ?? ""),
      )?.eventDate ?? null;

    let registrar: string | null = null;
    const entity = data.entities?.find((e) => e.roles?.includes("registrar"));
    const vcard = entity?.vcardArray as unknown[] | undefined;
    if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
      for (const entry of vcard[1] as unknown[]) {
        if (Array.isArray(entry) && entry[0] === "fn" && typeof entry[3] === "string") {
          registrar = entry[3];
        }
      }
    }
    return { registrationDate: registration, registrar, available: true };
  } catch {
    return { registrationDate: null, registrar: null, available: false };
  }
}

function textContent(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

function countMatches(haystack: string, patterns: RegExp[]): number {
  return patterns.reduce((n, pattern) => (pattern.test(haystack) ? n + 1 : n), 0);
}

export async function analyzeUrl(inputUrl: string): Promise<ScanResult> {
  const url = new URL(inputUrl);
  const host = url.hostname.toLowerCase();
  const domain = registrableDomain(host);
  const checks: ScanCheck[] = [];

  if (isBlockedHost(host)) {
    throw new Error("Diese Adresse kann nicht geprüft werden.");
  }

  const [page, rdap] = await Promise.all([fetchPage(inputUrl), lookupRdap(domain)]);

  const meta: ScanMeta = {
    httpStatus: page.status,
    redirects: page.redirects,
    https: page.httpsWorks,
    responseMs: page.responseMs,
    registrar: rdap.registrar,
    registrationDate: rdap.registrationDate,
    error: page.error ?? null,
  };

  // --- Erreichbarkeit ---
  checks.push({
    id: "reachable",
    label: "Shop ist erreichbar",
    category: "erreichbarkeit",
    weight: 10,
    status: page.ok ? "pass" : "fail",
    detail: page.ok
      ? `Der Server antwortete mit HTTP ${page.status} in ${page.responseMs} ms.`
      : (page.error ?? `Der Server antwortete mit HTTP ${page.status ?? "?"}.`),
  });

  checks.push({
    id: "https",
    label: "Verschlüsselte Verbindung (HTTPS)",
    category: "technik",
    weight: 10,
    status: page.httpsWorks ? "pass" : "fail",
    detail: page.httpsWorks
      ? "Die Seite ist über HTTPS mit gültigem Zertifikat erreichbar."
      : "Kein funktionierendes HTTPS bzw. kein gültiges Zertifikat. Zahlungsdaten wären unverschlüsselt.",
  });

  const finalUrl = page.finalUrl ?? inputUrl;
  const finalHost = (() => {
    try {
      return new URL(finalUrl).hostname.toLowerCase();
    } catch {
      return host;
    }
  })();

  checks.push({
    id: "redirects",
    label: "Weiterleitungen",
    category: "technik",
    weight: 5,
    status:
      registrableDomain(finalHost) === domain
        ? "pass"
        : page.redirects.length > 0
          ? "warn"
          : "unknown",
    detail:
      registrableDomain(finalHost) === domain
        ? `Die Adresse bleibt auf ${domain} (${page.redirects.length} Weiterleitung(en)).`
        : `Die Adresse leitet auf eine andere Domain weiter: ${finalHost}.`,
  });

  // --- Domainalter ---
  let domainAgeDays: number | null = null;
  if (rdap.registrationDate) {
    const registered = new Date(rdap.registrationDate).getTime();
    if (!Number.isNaN(registered)) {
      domainAgeDays = Math.floor((Date.now() - registered) / 86_400_000);
    }
  }
  meta.domainAgeDays = domainAgeDays;

  checks.push({
    id: "domain-age",
    label: "Alter der Domain",
    category: "domain",
    weight: 14,
    status:
      domainAgeDays === null
        ? "unknown"
        : domainAgeDays < 90
          ? "fail"
          : domainAgeDays < 365
            ? "warn"
            : "pass",
    detail:
      domainAgeDays === null
        ? "Für diese Domain-Endung sind keine öffentlichen Registrierungsdaten abrufbar."
        : `Registriert am ${new Date(rdap.registrationDate!).toLocaleDateString("de-DE")} – das sind ${domainAgeDays} Tage.${
            domainAgeDays < 90
              ? " Fakeshops sind meist nur wenige Wochen alt."
              : domainAgeDays < 365
                ? " Noch recht jung, deshalb mit Vorsicht behandeln."
                : " Ein etabliertes Alter spricht gegen einen kurzlebigen Fakeshop."
          }`,
  });

  checks.push({
    id: "registrar",
    label: "Registrar bekannt",
    category: "domain",
    weight: 3,
    status: rdap.registrar ? "pass" : "unknown",
    detail: rdap.registrar
      ? `Verwaltet über ${rdap.registrar}.`
      : "Der Registrar wird für diese Endung nicht veröffentlicht.",
  });

  const suspiciousTld = /\.(top|xyz|shop|store|online|icu|club|buzz|cyou|sbs|live|monster)$/i.test(
    domain,
  );
  const brandBait =
    /(outlet|sale|discount|billig|guenstig|günstig|cheap|deal|clearance|lager|shop24|official)/i.test(
      domain,
    );
  checks.push({
    id: "domain-name",
    label: "Domainname unauffällig",
    category: "domain",
    weight: 6,
    status: suspiciousTld && brandBait ? "fail" : suspiciousTld || brandBait ? "warn" : "pass",
    detail: [
      suspiciousTld ? "Die Endung wird häufig für Wegwerf-Shops genutzt." : null,
      brandBait
        ? "Der Domainname arbeitet mit Rabatt-/Outlet-Signalwörtern, ein typisches Fakeshop-Muster."
        : null,
    ]
      .filter(Boolean)
      .join(" ") || `Der Domainname ${domain} zeigt keine typischen Betrugsmuster.`,
  });

  const html = page.html ?? "";
  const lower = html.toLowerCase();
  const text = textContent(html);
  const textLower = text.toLowerCase();

  meta.title = /<title[^>]*>([\s\S]{0,200}?)<\/title>/i.exec(html)?.[1]?.trim() ?? null;

  if (!html) {
    const score = scoreFromChecks(checks);
    return {
      id: null,
      url: inputUrl,
      host,
      finalUrl: page.finalUrl ?? null,
      score,
      verdict: verdictFromScore(score),
      checks,
      meta,
      fetchedAt: new Date().toISOString(),
    };
  }

  // --- Rechtliche Pflichtseiten ---
  const hasImpressum = /impressum|impressumseite|legal-notice|kontakt\/impressum/i.test(lower);
  checks.push({
    id: "impressum",
    label: "Impressum vorhanden",
    category: "recht",
    weight: 14,
    status: hasImpressum ? "pass" : "fail",
    detail: hasImpressum
      ? "Ein Impressum bzw. eine rechtliche Anbieterkennzeichnung ist verlinkt."
      : "Kein Impressum gefunden. In Deutschland ist es Pflicht – ein Fehlen ist ein starkes Warnsignal.",
  });

  const legalPages = [
    { re: /\b(agb|allgemeine gesch)/i, name: "AGB" },
    { re: /datenschutz|privacy/i, name: "Datenschutz" },
    { re: /widerruf|rückgabe|ruckgabe|retoure/i, name: "Widerruf" },
    { re: /versand|lieferung|shipping/i, name: "Versand" },
  ];
  const foundLegal = legalPages.filter((p) => p.re.test(lower)).map((p) => p.name);
  checks.push({
    id: "legal-pages",
    label: "Pflichtseiten (AGB, Datenschutz, Widerruf, Versand)",
    category: "recht",
    weight: 10,
    status: foundLegal.length >= 4 ? "pass" : foundLegal.length >= 2 ? "warn" : "fail",
    detail:
      foundLegal.length === 0
        ? "Keine der rechtlich vorgeschriebenen Seiten gefunden."
        : `Gefunden: ${foundLegal.join(", ")}.${
            foundLegal.length < 4
              ? ` Es fehlen: ${legalPages
                  .filter((p) => !foundLegal.includes(p.name))
                  .map((p) => p.name)
                  .join(", ")}.`
              : ""
          }`,
  });

  const hasVat = /\b(ust[-\s.]?id|umsatzsteuer[-\s]?identifikations|vat[-\s]?id|de\s?\d{9})\b/i.test(
    text,
  );
  const hasRegister = /(handelsregister|hrb\s?\d+|hra\s?\d+|amtsgericht|companies house)/i.test(text);
  const hasPhone = /(\+\d{2,3}[\s\d/-]{6,}|tel[.:]?\s*0\d[\s\d/-]{5,})/i.test(text);
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(html);
  const hasAddress = /\b\d{4,5}\s+[A-ZÄÖÜ][a-zäöüß]+/.test(text) && /(str\.|straße|strasse|weg|platz|allee)/i.test(text);
  const contactSignals = [hasVat, hasRegister, hasPhone, hasEmail, hasAddress].filter(
    Boolean,
  ).length;

  checks.push({
    id: "contact",
    label: "Nachvollziehbare Anbieterdaten",
    category: "recht",
    weight: 12,
    status: contactSignals >= 4 ? "pass" : contactSignals >= 2 ? "warn" : "fail",
    detail:
      `Erkannt: ${[
        hasAddress ? "Anschrift" : null,
        hasPhone ? "Telefonnummer" : null,
        hasEmail ? "E-Mail" : null,
        hasVat ? "USt-IdNr." : null,
        hasRegister ? "Handelsregister" : null,
      ]
        .filter(Boolean)
        .join(", ") || "keine der üblichen Anbieterangaben"}.` +
      (contactSignals >= 4
        ? " Das ist ein vollständiges Bild."
        : " Seriöse Shops nennen Anschrift, Telefon, E-Mail, USt-IdNr. und Register."),
  });

  // --- Zahlungsarten ---
  const safePayments = [
    /paypal/i,
    /klarna/i,
    /kreditkarte|visa|mastercard|amex/i,
    /rechnung/i,
    /nachnahme/i,
    /apple\s?pay/i,
    /google\s?pay/i,
    /sofort(überweisung)?|sepa[- ]?lastschrift|giropay/i,
  ];
  const riskyPayments = [
    /vorkasse|vorauskasse/i,
    /banküberweisung|bank transfer|überweisung/i,
    /bitcoin|krypto|usdt|western union|moneygram/i,
  ];
  const safeCount = countMatches(lower, safePayments);
  const riskyCount = countMatches(lower, riskyPayments);
  checks.push({
    id: "payments",
    label: "Zahlungsarten mit Käuferschutz",
    category: "zahlung",
    weight: 14,
    status:
      safeCount === 0 && riskyCount > 0
        ? "fail"
        : safeCount === 0
          ? "unknown"
          : safeCount >= 2 && riskyCount <= 1
            ? "pass"
            : "warn",
    detail:
      safeCount === 0 && riskyCount > 0
        ? "Es werden nur Zahlungsarten ohne Käuferschutz erwähnt (z. B. Vorkasse, Überweisung, Krypto). Bei Betrug ist das Geld verloren."
        : safeCount === 0
          ? "Auf der Startseite sind keine Zahlungsarten erkennbar – vor dem Kauf im Checkout prüfen."
          : `${safeCount} Zahlungsart(en) mit Käuferschutz erkennbar${
              riskyCount > 0 ? `, zusätzlich ${riskyCount} risikoreiche Variante(n)` : ""
            }.`,
  });

  // --- Druck- und Rabattmuster ---
  const pressurePatterns = [
    /-\s?\d{2,3}\s?%/,
    /nur\s+(heute|noch\s+\d+)/i,
    /countdown|endet in|läuft ab in/i,
    /nur noch \d+ (auf lager|stück|verfügbar)/i,
    /ausverkauf|räumungsverkauf|liquidation|closing sale/i,
    /\b(80|85|90|95)\s?%\s?(rabatt|off)/i,
  ];
  const pressureHits = countMatches(textLower, pressurePatterns);
  checks.push({
    id: "pressure",
    label: "Kein künstlicher Kaufdruck",
    category: "inhalt",
    weight: 10,
    status: pressureHits >= 3 ? "fail" : pressureHits >= 1 ? "warn" : "pass",
    detail:
      pressureHits === 0
        ? "Keine übertriebenen Rabatt- oder Countdown-Muster gefunden."
        : `${pressureHits} Druckmuster gefunden (extreme Rabatte, Countdown, künstliche Knappheit). Fakeshops arbeiten damit gezielt.`,
  });

  // --- Sprache / Textqualität ---
  const germanContext = /(warenkorb|kasse|versandkosten|zzgl\.|inkl\. mwst|zur kasse)/i.test(
    textLower,
  );
  const brokenGerman = countMatches(textLower, [
    /artikel hinzufugen|hinzufugen/i,
    /warenkorb ist leer leer/i,
    /\bgroe(ss|ß)e wahlen\b/i,
    /kaufe jetzt|kaufen sie jetzt jetzt/i,
    /versandkosten frei weltweit/i,
  ]);
  const missingUmlauts =
    germanContext && /(fur den|uber uns|grosse auswahl|zuruck|wahrung)/i.test(textLower);
  checks.push({
    id: "language",
    label: "Sprachqualität des Shops",
    category: "inhalt",
    weight: 8,
    status: !germanContext
      ? "unknown"
      : brokenGerman > 0 || missingUmlauts
        ? "warn"
        : "pass",
    detail: !germanContext
      ? "Die Seite ist nicht klar als deutschsprachiger Shop erkennbar."
      : brokenGerman > 0 || missingUmlauts
        ? "Auffällige Übersetzungsfehler oder fehlende Umlaute – typisch für automatisch übersetzte Fakeshops."
        : "Die deutschsprachigen Shop-Texte wirken sprachlich sauber.",
  });

  // --- Trust-Signale ---
  const realSeals = countMatches(lower, [
    /trustedshops\.(com|de)/i,
    /ehi\.de/i,
    /trustpilot\.com/i,
    /haendlerbund\.de|händlerbund/i,
    /ekomi/i,
  ]);
  const fakeSealImages = /(?:img|src)[^>]{0,120}(trust|siegel|seal|guarantee|secure)[^>]{0,40}\.(png|jpg|jpeg|svg|webp)/i.test(
    lower,
  );
  checks.push({
    id: "seals",
    label: "Überprüfbare Gütesiegel",
    category: "inhalt",
    weight: 7,
    status: realSeals > 0 ? "pass" : fakeSealImages ? "warn" : "unknown",
    detail:
      realSeals > 0
        ? "Es sind Siegel-/Bewertungsanbieter verlinkt, deren Profil sich prüfen lässt."
        : fakeSealImages
          ? "Es werden Siegel-Grafiken gezeigt, aber ohne Link zum Prüfprofil – Fakeshops kopieren solche Bilder oft."
          : "Keine Gütesiegel gefunden. Das allein ist noch kein Betrugshinweis.",
  });

  const socialLinks = countMatches(lower, [
    /instagram\.com\//i,
    /facebook\.com\//i,
    /tiktok\.com\//i,
    /youtube\.com\//i,
  ]);
  checks.push({
    id: "social",
    label: "Auffindbare Social-Profile",
    category: "inhalt",
    weight: 4,
    status: socialLinks >= 2 ? "pass" : socialLinks === 1 ? "warn" : "unknown",
    detail:
      socialLinks === 0
        ? "Keine Social-Media-Profile verlinkt."
        : `${socialLinks} Social-Media-Profil(e) verlinkt – dort lässt sich prüfen, ob echte Kundenaktivität existiert.`,
  });

  const platform =
    /cdn\.shopify\.com|shopify/i.test(lower)
      ? "Shopify"
      : /woocommerce/i.test(lower)
        ? "WooCommerce"
        : /shopware/i.test(lower)
          ? "Shopware"
          : /wixstatic|wix\.com/i.test(lower)
            ? "Wix"
            : /magento/i.test(lower)
              ? "Magento"
              : /prestashop/i.test(lower)
                ? "PrestaShop"
                : null;
  meta.platform = platform;
  checks.push({
    id: "platform",
    label: "Shop-System erkennbar",
    category: "technik",
    weight: 3,
    status: platform ? "pass" : "unknown",
    detail: platform
      ? `Die Seite läuft auf ${platform}. Das sagt nichts über Seriosität, hilft aber bei der Einordnung.`
      : "Kein bekanntes Shop-System erkennbar – möglicherweise eine einfache Kopie-Seite.",
  });

  const hasProducts = /(warenkorb|in den korb|add to cart|zur kasse|checkout)/i.test(lower);
  checks.push({
    id: "shop-nature",
    label: "Seite ist ein echter Shop",
    category: "erreichbarkeit",
    weight: 5,
    status: hasProducts ? "pass" : "unknown",
    detail: hasProducts
      ? "Warenkorb-/Kassenfunktionen gefunden, es handelt sich um einen Verkaufsshop."
      : "Keine Warenkorb-Funktion auf dieser Seite gefunden – vielleicht eine Landing- oder Infoseite.",
  });

  const score = scoreFromChecks(checks);
  return {
    id: null,
    url: inputUrl,
    host,
    finalUrl: page.finalUrl ?? null,
    score,
    verdict: verdictFromScore(score),
    checks,
    meta,
    fetchedAt: new Date().toISOString(),
  };
}
