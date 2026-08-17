# Lime SafeGuard — Fakeshop Scanner

Eine echte, funktionierende Website: Nutzer gibt eine Shop-URL ein, der Server lädt und analysiert die Seite live und liefert einen Score von 0–100 mit nachvollziehbarer Begründung. Ergebnisse werden gespeichert und sind teilbar.

## Seiten

- `/` — Hero mit großem URL-Eingabefeld, Live-Scan, Ergebnis-Panel, kurze Erklärung "Wie wir prüfen", zuletzt geprüfte Shops.
- `/scan/$id` — teilbare Ergebnisseite eines Scans (Score, alle Einzelchecks, Zeitstempel).
- `/verlauf` — Liste der letzten Scans mit Score-Badges und Filter.
- `/ratgeber` — Merkmale von Fakeshops, was bei Betrug zu tun ist.
- `/impressum-hinweis` (Rechtliches/Haftungsausschluss: Bewertung ist automatisiert, keine Rechtsberatung).

## Was der Scanner wirklich prüft

Serverseitig wird die Seite abgerufen (Timeout, Redirect-Kette, HTML-Parsing) und folgende Signale werden ausgewertet:

- Erreichbarkeit, HTTP-Status, Redirect-Kette, Endziel-Domain
- HTTPS erzwungen, TLS-Zertifikat vorhanden/gültig, Zertifikatsaussteller
- Domain-Alter und Registrar über RDAP (sehr junge Domains = starkes Warnsignal)
- Impressum/Kontakt: Impressum-Link vorhanden, Firmenname, Adresse, USt-IdNr., Handelsregister, Telefon, E-Mail
- Rechtliche Pflichtseiten: AGB, Datenschutz, Widerrufsrecht, Versand/Zahlung
- Zahlungsarten: nur Vorkasse/Überweisung/Krypto = Warnsignal; Käuferschutz-Anbieter = positiv
- Preis-/Druckmuster: extreme Rabatte, Countdown, "nur heute", Lagerbestand-Panik
- Trust-Signale: echte Siegel-Links vs. reine Siegel-Bilder, Social-Links, Sprachqualität (deutsche Text-Heuristiken)
- Technisch: Shop-Baukasten-Fingerprint, WWW-/TLD-Auffälligkeiten, Markenname-im-Domain-Muster (Tippfehler-Domains)

Jeder Check liefert Status (bestanden / Warnung / kritisch), Gewicht und eine verständliche Erklärung. Der Gesamtscore ergibt sich gewichtet daraus, mit Einstufung: Vertrauenswürdig / Prüfen / Hohes Risiko. Nicht ermittelbare Signale werden als "unbekannt" ausgewiesen und nicht als Beweis gewertet.

## Design

Dunkles Security-Cockpit: Hintergrund #0B0F0C, Karten #121A14, Limegrün #A3E635 als Akzent, helle Schrift #E7F5DA. Monospace für Domain-/Datenwerte, große animierte Score-Anzeige, Check-Liste mit farbigen Statusbalken.

## Technische Umsetzung

- Lovable Cloud wird aktiviert (Datenbank für Scans).
- Tabelle `scans`: id, url, host, score, verdict, checks (jsonb), fetched_at, created_at. Öffentliches Lesen erlaubt (nur Scan-Daten, keine Personendaten), Schreiben nur über Serverfunktion.
- Server-Funktionen (`createServerFn`): `scanUrl` (Fetch + Analyse + Speichern), `getScan`, `listRecentScans`. Analyse-Logik in eigenen Server-Modulen pro Check-Gruppe, damit sie testbar bleibt.
- URL-Validierung mit Zod, nur http/https, Blockade privater/lokaler Adressen (SSRF-Schutz), Größen- und Zeitlimit beim Abrufen, Ergebnis-Caching pro Host für einige Minuten.
- Frontend nutzt TanStack Query; Ergebnisseite lädt per Loader, eigene SEO-Metadaten pro Route.
