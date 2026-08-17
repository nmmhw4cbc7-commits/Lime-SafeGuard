import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";

import { STATUS_LABEL, type CheckStatus, type ScanCheck } from "@/lib/scan/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<CheckStatus, { color: string; icon: typeof CheckCircle2 }> = {
  pass: { color: "text-success", icon: CheckCircle2 },
  warn: { color: "text-warning", icon: AlertTriangle },
  fail: { color: "text-destructive", icon: XCircle },
  unknown: { color: "text-muted-foreground", icon: HelpCircle },
};

const CATEGORY_LABEL: Record<ScanCheck["category"], string> = {
  erreichbarkeit: "Erreichbarkeit",
  domain: "Domain",
  recht: "Rechtliches",
  zahlung: "Zahlung",
  inhalt: "Inhalt & Auftritt",
  technik: "Technik",
};

export function CheckList({ checks }: { checks: ScanCheck[] }) {
  const grouped = checks.reduce<Record<string, ScanCheck[]>>((acc, check) => {
    (acc[check.category] ??= []).push(check);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {CATEGORY_LABEL[category as ScanCheck["category"]] ?? category}
          </h3>
          <ul className="space-y-2">
            {items.map((check) => {
              const style = STATUS_STYLE[check.status];
              const Icon = style.icon;
              return (
                <li
                  key={check.id}
                  className="flex gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <Icon className={cn("mt-0.5 size-5 shrink-0", style.color)} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-card-foreground">{check.label}</p>
                      <span
                        className={cn(
                          "rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                          style.color,
                        )}
                      >
                        {STATUS_LABEL[check.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {check.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
