# Knowsters

Mobile-first **Urban Fantasy Creature-Tactics-RPG**. Der Spieler ist ein sichtbarer Mensch, Wesen begleiten ihn, Kämpfe sind rundenbasierte Teamtaktik, und **Wissen** ist eine echte Voraussetzung für höhere Entwicklung.

**Stand: Vertical Slice v0.1** (Branch `claude/vertical-slice-v1`). Spielbarer Loop:

```
Home → Lichtquell (Welt) → Eno (NPC) → Werkhalle (Encounter) → Taktikkampf mit 4 Wesen
     → Ergebnis → Wissen (Üben / Prüfung) → Entwicklung → Glutspur frei → nächster Kampf
```

Live: https://pghess.github.io/knowsters/ · Referenzstände: https://pghess.github.io/knowsters/legacy/

## Schnellstart

```bash
npm ci            # Node >= 20
npm run dev       # http://localhost:5173/knowsters/
npm run verify    # typecheck + vitest + Legacy-Tests + Build
```

Weitere Befehle: `npm test` (vitest), `npm run typecheck`, `npm run build` (Vite → `apps/game/dist`), `npm run preview`, `npm run test:legacy` (alte Test-Suite gegen den v22-Build), `npm run extract:legacy-questions` (Fragenpools aus dem Legacy-Code nach JSON).

Debug-Parameter im Browser: `?fps=1` (Bildrate), `?lab=rig` (Rig-Labor mit Cutout-Rig und Spine-Runtime-Test).

## Struktur

```
apps/game            Vite + TypeScript + Phaser 4.2.1 (Szenen, DOM-Overlays, Store, Router)
packages/rules       Regelkern ohne DOM: Kampf, Progression, Wissen, Aufgaben, Terrain, Save
packages/content     Daten: Attribute, Fähigkeiten, Wesen, Bretter, Encounter, Curriculum, Fragen
legacy/              v22-Prototyp, v25-Spike, alte Tests – eingefroren, spielbar unter /legacy/
scripts/             Content-Extraktion, Freisteller-Pipeline
docs/                ARCHITECTURE, MIGRATION, KNOWN_ISSUES, ASSET_PIPELINE, TESTREPORT
```

Verbindliches Muster: **Command → Rules → State + Events → Presenter**. Phaser stellt dar, animiert und nimmt Input an; es berechnet keine Regeln. Siehe [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Produktentscheidungen, die im Code abgesichert sind

- Wissen gehört dem Spieler (`player.knowledge`), Attribute/Potenzial/Fähigkeiten dem einzelnen Wesen (`creatures[id]`).
- Falsche Antwort: ein Versuch, Sperre, Erklärung, neue ähnliche Aufgabe. Die eingeblendete Lösung ist nie anklickbar.
- Farming-Schutz: Entwicklung hängt von der Aufgabenstufe relativ zur nachgewiesenen Kompetenz ab (`developmentFor`).
- Prüfung: 5 neue Aufgaben, keine Hilfen, 4/5 = Nachweis im Spielerprofil.
- Ein Regelkern für alle Kämpfe (Prolog und Werkhalle), Brett und Missionsziel sind Daten.
- 8.000 Potenzialpunkte je Wesen, kein Attribut über 999 (getestet).

## Dokumente

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) – Schichten, Datenfluss, Save, Turn-Order-Modi
- [docs/MIGRATION.md](docs/MIGRATION.md) – was aus v22/v25 übernommen, portiert oder bewusst verworfen wurde
- [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) – Einschränkungen, bewusst verschobene Features
- [docs/ASSET_PIPELINE.md](docs/ASSET_PIPELINE.md) – Freisteller, Rig, Spine-Ergebnis, Arena-Aufbau
- [docs/TESTREPORT.md](docs/TESTREPORT.md) – Testlauf und Abnahmekriterien
- [DEPLOYMENT.md](DEPLOYMENT.md) – CI, Pages, Handytest, Capacitor-Pfad
- [docs/MOBILE_UX_BLUEPRINT_V1.md](docs/MOBILE_UX_BLUEPRINT_V1.md) – Produkt- und UX-Grundlage (unverändert)
