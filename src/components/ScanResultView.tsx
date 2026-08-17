import { Link } from "@tanstack/react-router";
import { ExternalLink, Share2 } from "lucide-react";

import { CheckList } from "@/components/CheckList";
import { ScoreDial } from "@/components/ScoreDial";
import { Button } from "@/components/ui/button";
import type { ScanResult } from "@/lib/scan/types";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="truncate font-mono text-sm text-foreground">{value}</span>
    </div>
  );
}

export function ScanResultView({ result }: { result: ScanResult }) {
  const summary =
    result.verdict === "risk"
      ? "Mehrere schwere Warnsignale. Hier solltest du nicht mit Vorkasse bezahlen."
      : result.verdict === "caution"
        ? "Gemischtes Bild. Prüfe Impressum, Zahlungsart und Bewertungen, bevor du bestellst."
        : "Keine typischen Fakeshop-Muster gefunden. Achte trotzdem auf Käuferschutz beim Bezahlen.";

  return (
    <div className="space-y-8">
      <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-[auto_1fr] md:p-8">
        <ScoreDial score={result.score} verdict={result.verdict} />
        <div className="space-y-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
              Prüfbericht
            </p>
            <h2 className="mt-1 break-all font-mono text-2xl font-bold">{result.host}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summary}</p>
          </div>
          <div className="rounded-lg border border-border bg-background/50 p-4">
            <MetaRow
              label="Geprüft am"
              value={new Date(result.fetchedAt).toLocaleString("de-DE")}
            />
            <MetaRow label="HTTP-Status" value={String(result.meta.httpStatus ?? "–")} />
            <MetaRow label="HTTPS" value={result.meta.https ? "aktiv" : "nicht nutzbar"} />
            <MetaRow
              label="Domainalter"
              value={
                result.meta.domainAgeDays != null
                  ? `${result.meta.domainAgeDays} Tage`
                  : "nicht abrufbar"
              }
            />
            <MetaRow label="Registrar" value={result.meta.registrar ?? "unbekannt"} />
            <MetaRow label="Shop-System" value={result.meta.platform ?? "unbekannt"} />
            <MetaRow label="Antwortzeit" value={`${result.meta.responseMs ?? 0} ms`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={result.url} target="_blank" rel="noopener noreferrer nofollow">
                <ExternalLink className="mr-2 size-4" /> Shop öffnen
              </a>
            </Button>
            {result.id ? (
              <Button asChild variant="secondary" size="sm">
                <Link to="/scan/$id" params={{ id: result.id }}>
                  <Share2 className="mr-2 size-4" /> Ergebnis-Link
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <CheckList checks={result.checks} />

      <p className="rounded-lg border border-border bg-surface p-4 text-xs leading-relaxed text-muted-foreground">
        Die Bewertung ist eine automatisierte technische Einschätzung anhand öffentlich
        abrufbarer Merkmale und keine Rechtsberatung. Ein guter Score ist keine Garantie, ein
        schlechter Score kein Beweis für Betrug.
      </p>
    </div>
  );
}
