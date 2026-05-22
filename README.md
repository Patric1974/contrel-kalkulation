# Contrel Kalkulation

Professionelle Kalkulationsapplikation für Contrel AG – Ihr B2B-Händler für Batterien, Akkumulatoren und Ladegeräte in der Schweiz.

## Voraussetzungen

- Node.js 18 oder höher
- npm 8 oder höher

## Installation

```bash
npm run install:all
```

Dieser Befehl installiert alle Abhängigkeiten für das Root-Projekt, den Client und den Server.

## Entwicklung starten

```bash
npm run dev
```

Startet gleichzeitig:
- **Frontend** (React + Vite) auf http://localhost:3000
- **Backend** (Node.js + Express) auf http://localhost:3001

## Projektstruktur

```
contrel-kalkulation/
  client/         → React Frontend (TypeScript, Tailwind CSS, Vite)
  server/         → Node.js Backend (Express, SQLite)
  db/             → SQLite-Datenbankdateien
```

## Funktionen

- Kalkulationen erstellen und verwalten
- Artikelkalkulation mit Einkaufspreis und Aufschlägen
- Automatische VEG-Berechnung nach INOBAT-Tarif 2026
- Marktpreisvergleich mit Ampel-System
- Mehrere Preiskategorien (Schaufensterpreis, Firmenkundenpreis, Händlerpreis)
- CSV-Export für Webshop, ERP und INOBAT-Meldung
- Kalkulationen teilen via Link

## Deployment (Railway / Render)

### Railway

1. Repository auf GitHub pushen
2. Neues Projekt auf Railway erstellen
3. Repository verbinden
4. Umgebungsvariablen setzen:
   - `PORT=3001`
   - `NODE_ENV=production`
5. Build-Befehl: `npm run install:all && npm run build --prefix client && npm run build --prefix server`
6. Start-Befehl: `node server/dist/index.js`

### Render

1. Repository auf GitHub pushen
2. Neuen Web Service auf Render erstellen
3. Build-Befehl: `npm run install:all && npm run build --prefix client && npm run build --prefix server`
4. Start-Befehl: `node server/dist/index.js`

## Hinweise

- Die SQLite-Datenbank wird automatisch beim ersten Start erstellt
- Session-IDs werden im Browser-LocalStorage gespeichert
- Kalkulationen können nur vom Ersteller (gleiche Session) bearbeitet werden
- Geteilte Links sind öffentlich lesbar
