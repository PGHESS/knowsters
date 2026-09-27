# Architektur – Knowsters Vertical Slice v0.1

## Schichten

```
┌──────────────────────────────────────────────────────────────┐
│ apps/game  (Vite · TypeScript strict · Phaser 4.2.1)          │
│  main.ts        Boot, Diagnose, Service-Worker-Bereinigung     │
│  router.ts      genau eine aktive Szene + DOM-Sheets darüber   │
│  store/         GameStore = zentraler Zustand + Save-Adapter   │
│  scenes/        Boot · Home · World · Battle · RigLab          │
│  ui/            DOM-Overlays: knowledge, team, dialog, result   │
│  rig/           CreatureRig (Cutout-Rig-API)                    │
│  human/         HumanFigure (prozeduraler Mensch)               │
│  battle/arena   Backdrop + Feldplatten + Props je Theme         │
│  world/plaza    Lichtquell-Platz + Terrain-Karte                │
├──────────────────────────────────────────────────────────────┤
│ packages/rules  (reines TypeScript, kein DOM, kein Phaser)     │
│  battle/engine  Kampf: Befehle → Zustand + Events              │
│  progression/   Attribute, Potenzial, Wesen, Wissen, Prüfung   │
│  questions/     Generatoren (Mathe, Logik), Pool-Auswahl       │
│  terrain.ts     begehbare Polygone, A*-Routing                 │
│  save/          Schema v30, Migrationen, Adapter-Interface     │
├──────────────────────────────────────────────────────────────┤
│ packages/content  (Daten)                                     │
│  attributes · abilities · creatures · boards · encounters      │
│  curriculum (JSON) · questions-legacy (JSON, 164 Items)        │
└──────────────────────────────────────────────────────────────┘
```

Abhängigkeitsrichtung: `game → rules → content`. Nie umgekehrt. `rules` und `content` laufen in Node (vitest) ohne Browser.

## Verbindliches Muster

```
Command  (Szene ruft z. B. setMode / tile / wait / rally / nextEnemyAction)
   ↓
Rules    (engine.ts mutiert BattleState, prüft Regeln, entscheidet Sieg/Niederlage)
   ↓
State + Events   (state.events: move, charge, beam, flame, enemy-hit, pulse, swap, spawn, escape, …)
   ↓
Presenter  (BattleScene spielt Events als Animation ab, dann syncUnits() aus dem Zustand)
```

Die Szene liest Schaden, LP und Ergebnis **nur** aus dem Zustand. `ks25-battle.js` (Spike) mit eigenen Mini-Regeln ist Referenz, nicht Basis.

## Kampf-Engine (packages/rules/src/battle)

- **Brett als Daten** (`BoardConfig`): Breite, Höhe, Torseite (`left|right|top|bottom|none`), Gegnerseite, Theme, statische Hindernisse. Prolog-Referenz 8×6 (Tor links, identische Koordinaten zu `prolog.js`) und Portrait 6×7 (Tor unten).
- **Missionsziel** (`Objective`): `holdGate` (Runden, max. Durchbrüche) oder `defeatAll` (max. Runden; Sieg nur, wenn keine Spawns mehr ausstehen).
- **Zugreihenfolge** konfigurierbar (`turnOrder`): `sides` (Team komplett, dann Gegner sequenziell) oder `initiative` (alle Einheiten nach Initiative-Attribut, Gegner eingeflochten). Beide sind getestet; Standard im Slice ist `sides` (siehe unten).
- **Fähigkeiten**: die 16 Prolog-Fähigkeiten mit unveränderten Werten. Signature-Fähigkeit (vierte) kostet 1 Resonanz. Voraussetzungen (Attribut, Fähigkeitspunkt, Wissensnachweis, Vorgänger) liegen im Content und werden von `checkUnlock` geprüft.
- **Abgeleitete Modifikatoren** (`deriveStats`, Tabelle `COMBAT_DERIVATION`): Vitalität → LP-Bonus, Angriff → Schadensbonus, Abwehr → Schildbonus, Beweglichkeit → Bewegung, Resonanz → Ressource, Fokus → längere Kontrolle, Charisma → stärkeres „Sammeln“, Intuition → Gegnerabsicht sichtbar, Willenskraft → Statusresistenz (Feld vorbereitet), Initiative → Reihenfolge. Werte bleiben klein (0–4).
- **Beschwörer-Befehl** `rally`: einmal pro Kampf, +1 Bewegung für die Runde, Schild für alle (1 + bestes Charisma-Bonus). Testbar, kein Deko.
- **Gegner-KI**: angrenzenden Wächter mit wenigsten LP angreifen; sonst BFS zum Tor (Torbrett) oder auf den nächsten Wächter zu (Hof); Lichtspur stoppt, Glut verletzt, Wurzeln halten.

### Zugreihenfolge – Einschätzung aus dem Slice

`sides` liest sich auf dem Handy klarer: Der Spieler plant vier Züge am Stück, die Gegnerphase ist ein sichtbarer Block. `initiative` erzeugt mehr taktische Textur (Reaktion auf einzelne Gegner), verlangt aber mehr HUD (Reihenfolge-Leiste) und mehr Erklärung. Empfehlung: `sides` für Prolog und erste Kapitel, `initiative` als spätere Option oder für Bosskämpfe; beides bleibt über `settings.turnOrder` schaltbar.

## Progression (packages/rules/src/progression)

- `createPotential`: exakt 8.000 Punkte, 500–999 je Attribut, 8 % atypische Individuen.
- `trainAttribute`: Entwicklungskosten je Wertebereich (2 … 8), Potenzial als harte Grenze.
- `PlayerKnowledge`: je Fach Stufe, **peakLevel** (nachweislich sichere Stufe), Serien, Themenstatistik; `proofs` = bestandene Nachweise.
- `developmentFor(taskLevel, peakLevel)`: 2 / 1 / 0 – Farming-Schutz.
- `startExam / answerExam`: 5 Items, 4/5 = `grantProof`; `applyExamReward` gibt +10 Entwicklung.
- `checkUnlock / unlockAbility`: Voraussetzungen gegen Instanz **und** Spielerprofil.

## Aufgaben (packages/rules/src/questions)

Einheitliches Item-Format (`QuestionItem`: id, subject, level, topicId, type `choice|numeric`, prompt, answers, correctAnswer, explanation, source, checkedAt, version). Mathe und Logik generativ (Port der v22-Generatoren), sieben Fächer aus dem extrahierten Pool. `examAvailable` prüft, ob genug unterschiedliche Items existieren.

## Save / State

- `SaveV30` (schema 30): player (Name, Altersband, Avatar, Wissen), creatures (Instanzen), team, companion, world, flags, battle (laufender Kampf), settings.
- `SaveAdapter`-Interface: `load / save / export / import / clear`. `KeyValueSaveAdapter` über `localStorage` (App) oder `MemoryStore` (Tests).
- Migration: `migrateLegacyV22` übernimmt Alter, Avatar, Wissensstufen, Prolog-Flag aus `knowsters-story-v2`; Wesen werden neu erzeugt. Ab v30 nummerierte Migrationen in `MIGRATIONS` (leer, Vorlage vorhanden).
- Der laufende Kampf wird nach jeder Aktion gespeichert; Reload setzt ihn fort (BootScene → Router.resume).

## Szenen und Overlays

- **Boot**: lädt Freisteller und Backdrop, zeigt Ladebalken, dann `resume()`.
- **Home**: letzter Ort als Hintergrund, Mensch + Begleiter, „Weiter“, Team / Wissen / Prolog.
- **World**: Platz mit Terrain-Polygon, Tap-to-Move über A*, Begleiter folgt, NPC-Dialog, Encounter.
- **Battle**: Presenter des Regelkerns (siehe oben). HUD oben (Runde, Zug, Ziel), Aktionsleiste unten in zwei Ebenen.
- **RigLab** (`?lab=rig`): Asset-Pilot.
- DOM-Sheets (`#ui`) für Lernen, Team, Dialog, Ergebnis. Während ein Sheet offen ist, ist der Phaser-Input gesperrt (`setInputGate`), sonst sickern Pointer-Events auf Canvas-Buttons durch.

## Diagnose

`diagnostics.ts` zeigt bei Fehlern Exception, Build-ID (Git-SHA + Zeit), Phaser-Version, Renderer, WebGL-Verfügbarkeit, User Agent und Viewport. Alte Service Worker und `knowsters-*`-Caches werden beim Start entfernt. Für den Slice gibt es bewusst **keinen** Service Worker.
