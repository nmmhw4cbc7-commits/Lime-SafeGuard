export type CheckStatus = "pass" | "warn" | "fail" | "unknown";

export type Verdict = "trusted" | "caution" | "risk";

export interface ScanCheck {
  id: string;
  label: string;
  category: "erreichbarkeit" | "domain" | "recht" | "zahlung" | "inhalt" | "technik";
  status: CheckStatus;
  weight: number;
  detail: string;
}

export interface ScanMeta {
  httpStatus?: number | undefined;
  redirects?: string[] | undefined;
  https?: boolean | undefined;
  domainAgeDays?: number | null | undefined;
  registrar?: string | null | undefined;
  registrationDate?: string | null | undefined;
  title?: string | null | undefined;
  platform?: string | null | undefined;
  responseMs?: number | undefined;
  error?: string | null | undefined;
}

export interface ScanResult {
  id: string | null;
  url: string;
  host: string;
  finalUrl: string | null;
  score: number;
  verdict: Verdict;
  checks: ScanCheck[];
  meta: ScanMeta;
  fetchedAt: string;
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  trusted: "Wenig Risiko",
  caution: "Genau prüfen",
  risk: "Hohes Risiko",
};

export const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: "bestanden",
  warn: "Warnung",
  fail: "kritisch",
  unknown: "unbekannt",
};

export function verdictFromScore(score: number): Verdict {
  if (score >= 75) return "trusted";
  if (score >= 45) return "caution";
  return "risk";
}

export function scoreFromChecks(checks: ScanCheck[]): number {
  const scored = checks.filter((c) => c.status !== "unknown");
  const total = scored.reduce((sum, c) => sum + c.weight, 0);
  if (total === 0) return 0;
  const earned = scored.reduce((sum, c) => {
    if (c.status === "pass") return sum + c.weight;
    if (c.status === "warn") return sum + c.weight * 0.45;
    return sum;
  }, 0);
  return Math.max(0, Math.min(100, Math.round((earned / total) * 100)));
}

export function normalizeInputUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}
