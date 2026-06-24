# Finca-Solutions LeadHub

Professionelle B2B SaaS-Plattform für freie Autohändler:
Fahrzeug-Leads, Verkäuferantworten, Ankaufspreise, Termine und Tagesberichte
zentral in einem Dashboard verwalten.

## Status

In Entwicklung — Grundstruktur und echter Login (Supabase) sind aufgebaut.

## Technik-Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** für Design
- **Supabase** für Login, CRM und Datenbank
- **PWA** — installierbar wie eine native App

## Projektstruktur

```
Fincar-LeadHub/
├── leadhub/             # Next.js-Anwendung
│   ├── .env.local       # echte Supabase-Schlüssel (NICHT im Repo)
│   └── .env.example     # Vorlage
└── README.md
```

## Erste Einrichtung

### 1. Supabase-Projekt anlegen

1. https://supabase.com aufrufen → Konto anlegen
2. **New Project** → Name `leadhub`, Region `Central EU (Frankfurt)`, Free Plan
3. Im Projekt: **Settings → API** öffnen
4. **Project URL** und **anon public** Key kopieren

### 2. .env.local befüllen

Im Ordner `leadhub/` eine Datei `.env.local` mit folgendem Inhalt anlegen:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Ersten Nutzer anlegen

Im Supabase-Dashboard: **Authentication → Users → Add user → Create new user**
E-Mail + Passwort vergeben. (Häkchen „Auto Confirm User" setzen, sonst muss
die E-Mail erst bestätigt werden.)

## Entwicklung starten

```
cd leadhub
npm install
npm run dev
```

Dann http://localhost:3000 öffnen.

## Wichtige Routen

| URL                 | Zweck                                |
|---------------------|--------------------------------------|
| `/`                 | Landing-Seite (öffentlich)           |
| `/login`            | Anmeldung                            |
| `/dashboard`        | Übersicht (geschützt)                |
| `/leads`            | Lead-Liste                           |
| `/leads/[id]`       | Lead-Detail                          |
| `/kampagnen`        | Suchprofile                          |
| `/berichte`         | Tagesberichte                        |
| `/einstellungen`    | Konto & Autohaus                     |
| `/admin`            | Interne Verwaltung (für Finca)       |
