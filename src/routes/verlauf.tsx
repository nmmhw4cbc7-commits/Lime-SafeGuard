import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { listRecentScans } from "@/lib/scans.functions";
import { VERDICT_LABEL, type Verdict } from "@/lib/scan/types";
import { cn } from "@/lib/utils";

const recentQuery = queryOptions({
  queryKey: ["recent-scans"],
  queryFn: () => listRecentScans(),
});

export const Route = createFileRoute("/verlauf")({
  loader: ({ context }) => context.queryClient.ensureQueryData(recentQuery),
  head: () => ({
    meta: [
      { title: "Scan-Verlauf – zuletzt geprüfte Shops | Lime SafeGuard" },
      {
        name: "description",
        content:
          "Alle zuletzt mit Lime SafeGuard geprüften Online-Shops mit Sicherheits-Score und Einstufung von wenig Risiko bis hohes Risiko.",
      },
      { property: "og:title", content: "Scan-Verlauf | Lime SafeGuard" },
      {
        property: "og:description",
        content: "Zuletzt geprüfte Online-Shops mit Score und Risiko-Einstufung.",
      },
    ],
  }),
  component: History,
});

const VERDICT_COLOR: Record<Verdict, string> = {
  trusted: "text-success",
  caution: "text-warning",
  risk: "text-destructive",
};

const FILTERS: { key: Verdict | "all"; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "risk", label: "Hohes Risiko" },
  { key: "caution", label: "Genau prüfen" },
  { key: "trusted", label: "Wenig Risiko" },
];

function History() {
  const { data } = useSuspenseQuery(recentQuery);
  const [filter, setFilter] = useState<Verdict | "all">("all");
  const rows = filter === "all" ? data : data.filter((scan) => scan.verdict === filter);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">Scan-Verlauf</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Die letzten 30 Prüfungen. Jeder Bericht ist über seinen Link teilbar.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.key}
            size="sm"
            variant={filter === item.key ? "default" : "outline"}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {rows.map((scan) => (
          <li key={scan.id}>
            <Link
              to="/scan/$id"
              params={{ id: scan.id }}
              className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-accent"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-sm">{scan.host}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(scan.fetchedAt).toLocaleString("de-DE")}
                </p>
              </div>
              <span
                className={cn("shrink-0 font-mono text-sm font-semibold", VERDICT_COLOR[scan.verdict])}
              >
                {scan.score} · {VERDICT_LABEL[scan.verdict]}
              </span>
            </Link>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            Keine Scans in dieser Kategorie.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
