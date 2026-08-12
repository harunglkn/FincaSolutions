# Technische Übersicht für die datenschutzrechtliche Prüfung

**System:** Finca Solutions / LeadHub
**Betreiber:** A.G. Automobile eGbR, Inhaber Gültekin Harun, Robert-Bosch-Straße 4, 64319 Pfungstadt
**Stand:** 12.08.2026
**Zweck dieses Dokuments:** Sachverhaltsdarstellung für die anwaltliche Prüfung
(Datenschutzerklärung, Auftragsverarbeitungsvertrag, AGB).

> Dieses Dokument beschreibt ausschließlich **Technik und Datenflüsse**. Es
> enthält keine rechtliche Bewertung.

---

## 1. Was das System macht

Ein Werkzeug für den **Ankauf von Gebrauchtwagen von Privatpersonen**:

1. Ein Programm auf einem Windows-Rechner durchsucht **mobile.de** nach
   Fahrzeug-Inseraten von **Privatverkäufern** (Filter: Marke, Baujahr,
   Kilometer, Umkreis).
2. Für jedes Fahrzeug wird über eine zweite, öffentliche Suche auf mobile.de
   ein **Marktwert** ermittelt.
3. Über das **Nachrichtensystem von mobile.de** wird dem Inserenten ein
   unverbindliches Ankaufsangebot gesendet, inklusive Link zur
   Online-Terminbuchung.
4. Antworten der Verkäufer werden ausgelesen und in einer Web-Anwendung (CRM)
   angezeigt.
5. Verkäufer können über einen persönlichen Link selbst einen
   Besichtigungstermin buchen.

**Wichtig:** Es findet **kein E-Mail-Versand** an Verkäufer statt und es werden
**keine E-Mail-Adressen von mobile.de ausgelesen**. Die Kommunikation läuft
ausschließlich über das interne Nachrichtensystem von mobile.de.

---

## 2. Verarbeitete personenbezogene Daten

### 2.1 Aus dem Inserat erfasst (ohne Zutun der betroffenen Person)

| Feld | Inhalt | Personenbezug |
|---|---|---|
| `verkaeufer_name` | Vorname bzw. Anzeigename aus dem Inserat | **ja** |
| `ort` | Ort/Region aus dem Inserat | ja (indirekt) |
| `external_id` | Inserats-Nummer von mobile.de | ja (indirekt) |
| Fahrzeugdaten | Modell, Baujahr, km, Getriebe, Kraftstoff, HU, Farbe | ja (indirekt, über das Fahrzeug zuordenbar) |
| Preise | Inseratspreis, ermittelter Marktwert, eigenes Angebot | nein |

### 2.2 Nachrichteninhalte

| Feld | Inhalt |
|---|---|
| `lead_messages.text` | Vollständiger Wortlaut **beider** Richtungen (eigene Anfragen und Verkäufer-Antworten). Verkäufer geben dort teils **freiwillig** Telefonnummern, Namen oder Adressen an. |
| Zeitstempel | Wann gesendet/empfangen |

### 2.3 Vom Verkäufer selbst eingegeben (Terminbuchung)

| Feld | Pflicht |
|---|---|
| `seller_name` | ja |
| `seller_phone` | ja |
| `seller_email` | optional |
| `vehicle_plate` (Kennzeichen) | optional |
| `note` (Freitext) | optional |
| Terminwunsch (Datum/Uhrzeit) | ja |

### 2.4 Daten des Nutzers (Händler)

E-Mail-Adresse, Passwort (gehasht, von Supabase verwaltet), Firmenname,
Vor-/Nachname, Telefon, Adresse, Öffnungs-/Terminzeiten.

---

## 3. Wo die Daten liegen

| Ort | Anbieter | Was |
|---|---|---|
| **Datenbank + Anmeldung** | **Supabase** (Projekt `ytcasonruocjwwzqvezh`) | alle Leads, Nachrichten, Termine, Konten |
| **Web-Anwendung (Hosting)** | **Vercel** | das CRM unter `fincasolutions.vercel.app` (geplante Domain: finca-solutions.de) |
| **Lokaler Rechner** des Händlers | — | Chrome-Profil (enthält die mobile.de-Anmeldung), Liste bereits kontaktierter Inserats-Nummern, zwischengespeicherte Marktdaten (keine Personendaten), Protokolldateien |
| **mobile.de** | Drittanbieter | Nachrichtenverlauf verbleibt zusätzlich dort |

**⚠️ Vom Anwalt zu klären / vom Betreiber zu prüfen:**
- **Server-Region des Supabase-Projekts** (EU oder USA?) — im Supabase-Dashboard
  unter Project Settings einsehbar. Für die Bewertung entscheidend.
- Supabase und Vercel sind **Unterauftragnehmer** und müssen im AVV benannt
  werden; deren eigene AV-Verträge sind abzuschließen.

---

## 4. Wer Zugriff hat

- **Jeder Händler sieht ausschließlich seine eigenen Daten.** Das ist nicht nur
  in der Oberfläche geregelt, sondern direkt in der Datenbank erzwungen
  (Row Level Security: Zugriff nur, wenn `user_id` = angemeldeter Nutzer).
- **Öffentlich ohne Anmeldung erreichbar** ist ausschließlich die
  **Terminbuchungsseite** `…/termin/<Token>`. Der Token ist ein zufälliger
  10-Zeichen-Code, der genau ein Fahrzeug betrifft. Über diese Seite sind
  sichtbar: Fahrzeugbezeichnung, Name des Autohauses, freie Termine.
  **Nicht** sichtbar: andere Leads, Preise, Nachrichten.
- **Der Betreiber (A.G. Automobile eGbR)** hat als Projektinhaber technisch
  Vollzugriff auf die Datenbank (Administrationsschlüssel).
- **Das Programm auf dem Kunden-Rechner** erhält bei der geplanten
  Mehrmandanten-Version einen **eigenen Token**, der ausschließlich das Konto
  dieses Kunden öffnet (kein Administrationsschlüssel beim Kunden).

---

## 5. Löschung und Aufbewahrung

**⚠️ Wesentliche Lücke — hier besteht Handlungsbedarf:**

- Es gibt **keine automatische Löschung** und **keine definierte
  Aufbewahrungsfrist**. Daten bleiben unbegrenzt gespeichert.
- Ein einzelner Lead kann **manuell** in der Oberfläche gelöscht werden
  (Nachrichten und Termine werden dabei mitgelöscht).
- Wird ein Nutzerkonto gelöscht, werden alle zugehörigen Daten automatisch
  mitgelöscht (Fremdschlüssel mit `on delete cascade`).
- **Kein automatisierter Auskunfts- oder Löschprozess** für betroffene
  Verkäufer vorhanden.

Empfehlung zur Klärung: Welche Aufbewahrungsfrist ist zulässig/erforderlich
(z. B. 6 oder 12 Monate nach letztem Kontakt)? Die technische Umsetzung einer
automatischen Löschung ist möglich, sobald die Frist feststeht.

---

## 6. Besonders prüfungsbedürftige Punkte

1. **Datenerhebung ohne Kenntnis der betroffenen Person**
   Die Verkäufer wissen nicht, dass ihre Inseratsdaten in einem CRM gespeichert
   werden. Relevant: Informationspflicht bei Daten, die nicht bei der
   betroffenen Person erhoben wurden (Art. 14 DSGVO). **Betrifft bereits den
   heutigen Eigenbetrieb.**
   → Zu klären: Muss ein Hinweis in die Erstnachricht? Welcher Wortlaut?
   *(Technische Randbedingung: mobile.de blockiert Nachrichten mit `http://`,
   `https://` oder `www.` — ein anklickbarer Link ist nicht möglich; eine
   Domain ohne Schema wird durchgelassen.)*

2. **Automatisierte Ansprache**
   Die Erstansprache erfolgt automatisiert. Zu prüfen: wettbewerbsrechtliche
   Zulässigkeit (UWG) und datenschutzrechtliche Rechtsgrundlage.

3. **Rolle beim Verkauf an andere Händler**
   Sobald Dritte das System nutzen, verarbeitet der Betreiber Daten **in deren
   Auftrag** → Auftragsverarbeitungsvertrag je Kunde erforderlich,
   Unterauftragnehmer (Supabase, Vercel) inklusive.

4. **Plattform-Nutzungsbedingungen**
   Die automatisierte Nutzung von mobile.de ist nach deren
   Nutzungsbedingungen nicht vorgesehen. Zu bewerten: vertragliches Risiko,
   insbesondere bei Weitergabe an Kunden.

5. **Freitextfelder**
   In Nachrichten und Terminnotizen können Verkäufer beliebige Angaben machen
   (auch besondere Kategorien personenbezogener Daten). Es gibt keine
   inhaltliche Filterung.

---

## 7. Technische Schutzmaßnahmen (bereits umgesetzt)

- Verschlüsselte Übertragung (HTTPS) für die gesamte Web-Anwendung.
- Datenbankseitige Mandantentrennung (Row Level Security) — nicht nur in der
  Oberfläche, sondern in der Datenbank selbst erzwungen.
- Passwörter werden nicht im Klartext gespeichert (Verwaltung durch Supabase).
- Öffentliche Zugriffe (Terminbuchung) laufen ausschließlich über eng
  begrenzte Datenbankfunktionen; kein direkter Tabellenzugriff.
- Zufällige, nicht erratbare Tokens für Buchungslinks.
- Beim geplanten Kundenbetrieb: kein Administrationsschlüssel auf Kundengeräten
  (eigener, widerrufbarer Token je Arbeitsplatz).
- Buchungstermine sind gegen Doppelbelegung gesichert.

---

## 8. Benötigte Dokumente (Auftrag an die Kanzlei)

1. **Datenschutzerklärung** für `finca-solutions.de` / die Web-Anwendung
   (die aktuelle Fassung ist eine ungeprüfte Vorlage).
2. **Auftragsverarbeitungsvertrag (AVV)** als Muster für Händler-Kunden,
   inklusive Unterauftragnehmer-Liste.
3. **AGB / Nutzungsbedingungen** für das SaaS-Angebot.
4. **Hinweistext** zur Erfüllung der Informationspflicht gegenüber Verkäufern
   (Formulierungsvorschlag, unter der oben genannten Zeichen-/Link-Restriktion).
5. **Empfehlung zur Aufbewahrungsfrist**, damit die automatische Löschung
   technisch umgesetzt werden kann.

---

## 9. Ansprechpartner für Rückfragen

Technische Rückfragen zum System beantwortet der Betreiber. Bei Bedarf können
Datenbankschema, Beispieldatensätze und Nachrichtenvorlagen bereitgestellt
werden.
