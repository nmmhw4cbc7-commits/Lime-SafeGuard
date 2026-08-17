import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Radar, ShieldCheck, ScanSearch, Landmark, CreditCard } from "lucide-react";
import { useState } from "react";

import { ScanResultView } from "@/components/ScanResultView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listRecentScans, scanUrl } from "@/lib/scans.functions";
import { normalizeInputUrl, VERDICT_LABEL, type ScanResult } from "@/lib/scan/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lime SafeGuard – Fakeshop Scanner für Online-Shops" },
      {
        name: "description",
        content:
          "URL eingeben und in Sekunden prüfen: Lime SafeGuard analysiert Impressum, Domainalter, Zahlungsarten und Betrugsmuster eines Online-Shops und liefert einen Sicherheits-Score.",
      },
      { property: "og:title", content: "Lime SafeGuard – Fakeshop Scanner" },
      {
        property: "og:description",
        content:
          "Echter Live-Scan von Online-Shops: Impressum, Domainalter, Zahlungsarten und Betrugsmuster – mit Score von 0 bis 100.",
      },
    ],
  }),
  component: Home,
});

const VERDICT_COLOR = {
  trusted: "text-success",
  caution: "text-warning",
  risk: "text-destructive",
} as const;

function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runScan = useServerFn(scanUrl);
  const fetchRecent = useServerFn(listRecentScans);

  const recent = useQuery({
    queryKey: ["recent-scans"],
    queryFn: () => fetchRecent(),
  });

  const mutation = useMutation({
    mutationFn: (url: string) => runScan({ data: { url } }),
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      void recent.refetch();
    },
    onError: (err: Error) => {
      setResult(null);
      setError(err.message || "Der Scan konnte nicht abgeschlossen werden.");
    },
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeInputUrl(input);
    if (!normalized) {
      setError("Bitte eine gültige Adresse eingeben, z. B. beispiel-shop.de");
      return;
    }
    setError(null);
    mutation.mutate(normalized);
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            <Radar className="size-3.5" /> Live-Analyse
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
            Ist dieser Shop echt?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Lime SafeGuard lädt die Seite live, prüft Impressum, Domainalter, Zahlungsarten,
            Pflichtseiten und typische Betrugsmuster – und liefert einen nachvollziehbaren Score
            von 0 bis 100.
          </p>

          <form onSubmit={submit} className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="z. B. beispiel-shop.de"
              inputMode="url"
              maxLength={300}
              aria-label="Shop-Adresse"
              className="h-12 font-mono text-base"
            />
            <Button type="submit" size="lg" disabled={mutation.isPending} className="h-12">
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Scanne…
                </>
              ) : (
                <>
                  <ScanSearch className="mr-2 size-4" /> Shop prüfen
                </>
              )}
            </Button>
          </form>
          {error ? (
            <p className="mt-3 text-sm font-medium text-destructive">{error}</p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Kein Login nötig. Ein Scan dauert je nach Shop 2–15 Sekunden.
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12">
        {mutation.isPending ? (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-10 text-center">
            <div
              aria-hidden
              className="scan-sweep absolute inset-x-0 top-0 h-24 bg-linear-to-b from-primary/25 to-transparent"
            />
            <Loader2 className="mx-auto size-8 animate-spin text-primary" />
            <p className="mt-4 font-mono text-sm text-muted-foreground">
              Seite wird geladen, Domain-Registrierung und Pflichtangaben werden geprüft…
            </p>
          </div>
        ) : null}

        {result ? <ScanResultView result={result} /> : null}

        {!result && !mutation.isPending ? (
          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Landmark,
                title: "Anbieter & Recht",
                text: "Impressum, Anschrift, USt-IdNr., Handelsregister, AGB, Widerruf und Datenschutz.",
              },
              {
                icon: ShieldCheck,
                title: "Domain & Technik",
                text: "Registrierungsdatum über RDAP, HTTPS-Zertifikat, Weiterleitungen, Shop-System.",
              },
              {
                icon: CreditCard,
                title: "Zahlung & Muster",
                text: "Käuferschutz-Zahlarten, Vorkasse-Fallen, Rabatt- und Countdown-Druck, Sprachqualität.",
              },
            ].map((item) => (
              <article key={item.title} className="rounded-xl border border-border bg-card p-6">
                <item.icon className="size-6 text-primary" />
                <h2 className="mt-3 text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </section>
        ) : null}

        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold">Zuletzt geprüft</h2>
            <Link to="/verlauf" className="text-sm text-primary hover:underline">
              Ganzen Verlauf ansehen
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {(recent.data ?? []).slice(0, 8).map((scan) => (
              <li key={scan.id}>
                <Link
                  to="/scan/$id"
                  params={{ id: scan.id }}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent"
                >
                  <span className="truncate font-mono text-sm">{scan.host}</span>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-sm font-semibold",
                      VERDICT_COLOR[scan.verdict],
                    )}
                  >
                    {scan.score} · {VERDICT_LABEL[scan.verdict]}
                  </span>
                </Link>
              </li>
            ))}
            {recent.data && recent.data.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                Noch keine Scans. Sei der erste.
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
