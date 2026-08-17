import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hinweise")({
  head: () => ({
    meta: [
      { title: "Rechtliche Hinweise & Methodik | Lime SafeGuard" },
      {
        name: "description",
        content:
          "Wie der Score von Lime SafeGuard entsteht, welche Daten geprüft werden, welche Grenzen die automatisierte Bewertung hat und welche Daten gespeichert werden.",
      },
      { property: "og:title", content: "Rechtliche Hinweise & Methodik" },
      {
        property: "og:description",
        content: "Methodik, Grenzen und Datenverarbeitung des Fakeshop-Scanners.",
      },
    ],
  }),
  component: Legal,
});

const SECTIONS = [
  {
    title: "So entsteht der Score",
    body: "Der Scanner ruft die eingegebene Seite serverseitig ab, folgt Weiterleitungen und wertet den HTML-Quelltext aus. Zusätzlich wird das Registrierungsdatum der Domain über das öffentliche RDAP-Register abgefragt. Jede Einzelprüfung erhält ein Gewicht und einen Status: bestanden, Warnung, kritisch oder unbekannt. Der Score ist der gewichtete Anteil bestandener Prüfungen; unbekannte Prüfungen werden nicht gegen den Shop gewertet.",
  },
  {
    title: "Einstufungen",
    body: "75 bis 100 Punkte: wenig Risiko. 45 bis 74 Punkte: genau prüfen. Unter 45 Punkten: hohes Risiko. Die Grenzen sind bewusst konservativ gesetzt, damit auffällige Shops nicht durchrutschen.",
  },
  {
    title: "Grenzen der Prüfung",
    body: "Es wird nur die öffentlich erreichbare Seite analysiert – kein Bestellvorgang, keine Bonitäts- oder Registerabfrage bei Behörden. Ein hoher Score ist keine Garantie für einen seriösen Händler, ein niedriger Score kein Beweis für Betrug. Die Bewertung ist eine technische Einschätzung und keine Rechtsberatung.",
  },
  {
    title: "Gespeicherte Daten",
    body: "Gespeichert werden die geprüfte Adresse, der Host, das Ergebnis der Einzelprüfungen, der Score und der Prüfzeitpunkt. Es werden keine Nutzerkonten, IP-Adressen oder personenbezogenen Eingaben gespeichert. Prüfberichte sind über ihren Link öffentlich einsehbar.",
  },
  {
    title: "Widerspruch für Shop-Betreiber",
    body: "Betreiber, die eine Bewertung für unzutreffend halten, können die Löschung eines Berichts verlangen. Nach Behebung der beanstandeten Punkte liefert ein erneuter Scan sofort ein aktualisiertes Ergebnis.",
  },
];

function Legal() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold md:text-4xl">Rechtliche Hinweise & Methodik</h1>
      <div className="mt-8 space-y-4">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
