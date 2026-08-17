import { VERDICT_LABEL, type Verdict } from "@/lib/scan/types";
import { cn } from "@/lib/utils";

const VERDICT_COLOR: Record<Verdict, string> = {
  trusted: "text-success",
  caution: "text-warning",
  risk: "text-destructive",
};

export function ScoreDial({
  score,
  verdict,
  size = 190,
}: {
  score: number;
  verdict: Verdict;
  size?: number;
}) {
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={10}
            className="stroke-border"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className={cn("transition-all duration-700", VERDICT_COLOR[verdict])}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-mono text-5xl font-bold", VERDICT_COLOR[verdict])}>
            {score}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            von 100
          </span>
        </div>
      </div>
      <span
        className={cn(
          "rounded-full border px-4 py-1 text-sm font-semibold",
          VERDICT_COLOR[verdict],
        )}
      >
        {VERDICT_LABEL[verdict]}
      </span>
    </div>
  );
}
