import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { ScanResultView } from "@/components/ScanResultView";
import { getScan } from "@/lib/scans.functions";

const scanQuery = (id: string) =>
  queryOptions({
    queryKey: ["scan", id],
    queryFn: () => getScan({ data: { id } }),
  });

export const Route = createFileRoute("/scan/$id")({
  loader: async ({ context, params }) => {
    const scan = await context.queryClient.ensureQueryData(scanQuery(params.id));
    if (!scan) throw notFound();
    return { host: scan.host, score: scan.score };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Prüfbericht nicht verfügbar – Lime SafeGuard" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.host}: Score ${loaderData.score}/100 – Lime SafeGuard`;
    const description = `Automatisierter Fakeshop-Check für ${loaderData.host}: Impressum, Domainalter, Zahlungsarten und Betrugsmuster im Detail.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ScanDetail,
});

function ScanDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(scanQuery(id));

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Prüfbericht nicht gefunden</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">
          Neuen Scan starten
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link to="/" className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
        ← Neuer Scan
      </Link>
      <h1 className="mt-4 mb-8 break-all text-3xl font-bold">Prüfbericht {data.host}</h1>
      <ScanResultView result={data} />
    </div>
  );
}
