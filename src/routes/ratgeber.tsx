import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/ratgeber")({
  head: () => ({
    meta: [
      { title: "Fakeshop erkennen: 9 Warnsignale & Soforthilfe | Lime SafeGuard" },
      {
        name: "description",
        content:
          "Woran erkennt man einen Fakeshop? Die wichtigsten Warnsignale bei Impressum, Preisen und Zahlung – plus die richtigen Schritte, wenn du schon bezahlt hast.",
      },
      { property: "og:title", content: "Fakeshop erkennen – Ratgeber" },
      {
        property: "og:description",
        content: "Warnsignale bei Impressum, Preisen und Zahlung sowie Soforthilfe nach einer Zahlung.",
      },
    ],
  }),
  component: Guide,
});

const SIGNALS = [
  {
    title: "Preise weit unter Marktniveau",
    text: "Markenware mit 70–90 % Rabatt ist praktisch immer ein Lockangebot. Vergleiche denselben Artikel bei zwei etablierten Händlern.",
  },
  {
    title: "Impressum fehlt oder ist unvollständig",
    text: "Kein Firmenname, keine Anschrift, keine USt-IdNr., keine Registernummer: In Deutschland ist das ein Gesetzesverstoß und ein starkes Warnsignal.",
  },
  {
    title: "Nur Vorkasse, Überweisung oder Krypto",
    text: "Verschwindet die Zahlart mit Käuferschutz erst im Checkout, brich ab. Bei Überweisung und Krypto ist das Geld praktisch nicht zurückzuholen.",
  },
  {
    title: "Sehr junge Domain",
    text: "Fakeshops leben oft nur Wochen. Ein Registrierungsdatum von vor wenigen Tagen passt nicht zu einem etablierten Händler.",
  },
  {
    title: "Kopierte Gütesiegel",
    text: "Ein Siegel-Bild ohne klickbares Prüfprofil ist wertlos. Echte Siegel führen immer zu einem Profil beim Anbieter.",
  },
  {
    title: "Übersetzte Textbausteine",
    text: "Fehlende Umlaute, seltsame Satzstellung und generische Produktbeschreibungen deuten auf automatisch erzeugte Shop-Kopien hin.",
  },
  {
    title: "Künstlicher Zeitdruck",
    text: "Countdown, „nur noch 2 auf Lager“ und Dauer-Ausverkauf sollen verhindern, dass du in Ruhe prüfst.",
  },
  {
    title: "Keine erreichbare Kundenbetreuung",
    text: "Nur ein Kontaktformular, keine Telefonnummer, Antworten per Freemail-Adresse: typisch für Wegwerf-Shops.",
  },
  {
    title: "Bewertungen nur auf der eigenen Seite",
    text: "Suche den Shopnamen zusammen mit „Erfahrungen“ oder „Betrug“ und prüfe unabhängige Portale.",
  },
];

const STEPS = [
  "Zahlung stoppen: Bank oder Zahlungsdienstleister sofort kontaktieren und Rückbuchung bzw. Käuferschutzfall eröffnen.",
  "Beweise sichern: Screenshots von Angebot, Bestellbestätigung, Impressum und Zahlungsbeleg speichern.",
  "Anzeige erstatten: Online-Wache der Polizei deines Bundeslandes nutzen.",
  "Meldung machen: Fakeshop bei der Verbraucherzentrale und beim Zahlungsanbieter melden.",
  "Karte prüfen: Bei Kreditkartendaten auf der Seite die Karte sperren lassen.",
];

function Guide() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold md:text-4xl">Fakeshops erkennen</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Diese Merkmale prüft Lime SafeGuard automatisiert – und darauf solltest du zusätzlich
        selbst achten, bevor du in einem unbekannten Shop bezahlst.
      </p>

      <div className="mt-10 space-y-4">
        {SIGNALS.map((signal, index) => (
          <article key={signal.title} className="rounded-xl border border-border bg-card p-5">
            <div className="flex gap-4">
              <span className="font-mono text-sm text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-semibold">{signal.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {signal.text}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <h2 className="mt-14 text-2xl font-bold">Schon bezahlt? Diese Schritte jetzt</h2>
      <ol className="mt-4 space-y-3">
        {STEPS.map((step, index) => (
          <li key={step} className="flex gap-3 rounded-lg border border-border bg-surface p-4">
            <span className="font-mono text-sm text-primary">{index + 1}</span>
            <span className="text-sm leading-relaxed text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Unsicher bei einem konkreten Shop?</p>
        <Link
          to="/"
          className="mt-2 inline-block font-semibold text-primary hover:underline"
        >
          Jetzt Shop-Adresse prüfen →
        </Link>
      </div>
    </div>
  );
}
