# Migration v22 / v25 → Vertical Slice v0.1

## Übernommen (portiert nach TypeScript, Verhalten identisch)

| Legacy | Neu | Nachweis |
|---|---|---|
| `prolog.js` Regelkern (Fähigkeiten, Gegnerphase, Wände, Glut, Lichtspur, Push, Swap, Analyse, Spawns, Tutorial-Hinweise) | `packages/rules/src/battle/engine.ts` | `tests/battle.test.ts` (Aufbau, Seiten- und Initiative-Modus, Wall, Tor halten, Durchbruch, Rally, Resonanz, defeatAll, Impuls, Reload) |
| `progression.js` Potenzial (8.000/999), Entwicklungskosten, `trainAttribute` | `progression/attributes.ts` | `tests/progression.test.ts` (800 Instanzen) |
| `progression.js` Mathe- und Logik-Generatoren | `questions/math.ts`, `questions/logic.ts` | `tests/questions.test.ts` (960 Aufgaben unabhängig nachgerechnet, Port des alten `learning.test.cjs`) |
| `progression.js` Curriculum 10 × 8, Domänen, Altersbänder | `packages/content/src/data/*.json` (per Skript extrahiert) | `tests/content.test.ts` |
| `progression.js` Fragenbanken (7 Fächer + Sprache) | `data/questions-legacy.json`, 164 Items im neuen Format | `tests/content.test.ts` |
| `terrain.js` (Polygone, A*, Gleiten) | `rules/terrain.ts` mit Kartenparameter | `tests/terrain.test.ts` |
| `avatar.js` Farbpaletten | `apps/game/src/human/palette.ts` | – |
| Spielstand `knowsters-story-v2` | `migrateLegacyV22` → SaveV30 | `tests/save.test.ts` |
| Spike-Look (Portrait 6×7, HUD-Pills, Bottom Bar, Bewegungsreichweite im Feld) | `BattleScene`, `arena.ts` | Screenshots in TESTREPORT |

## Bewusst verworfen

- **1v1-Duell** (`game.js move()`, `enemies.js`, `battle-fx.js`, Moos/Funke/Welle mit Fokus/Schild/Summon). Produktziel ist Teamtaktik; ein zweites Kampfsystem widerspricht „Regelkern als einzige Wahrheit“. Die regionalen Gegner (Sporenkäfer, Krabbe, …) können später als Taktik-Einheiten neu definiert werden.
- **Mini-Kampfregeln des Spikes** (`ks25-battle.js`): nur Referenz für Look-and-Feel.
- **„Wissenspunkte“ als Eintrittspreis** für Aufgaben. Üben ist frei (Auftrag §12).
- **Stufenunabhängige +2 Entwicklung**: ersetzt durch `developmentFor` (Farming-Schutz).
- **Service Worker** des v22-Builds: cache-first ohne Ablauf, verfälscht Gerätetests. Im Slice kein Service Worker; alte Registrierungen werden entfernt.
- **Key Art mit eingebranntem Text** (`guardians-prolog.webp`) im Startscreen.
- **Kapitel 2–5, Story-Zonen, Comics, Garderobe/Editor-UI, Beziehungssystem (Loben/Kuscheln), MCP-Tools in `game.js`**: nicht Teil des Slice; Daten im Legacy-Ordner erhalten.

## Verändert

- Wächter sind jetzt **Instanzen** mit Attributen/Potenzial (`createCreature`), nicht feste Prolog-Datensätze. LP/Bewegung = Basis + kleine Boni.
- Brett und Tor sind Daten; der Prolog läuft im Slice auf 6×7 Portrait (Tor unten). Die 8×6-Referenz bleibt als `BOARD_BRIDGE_LANDSCAPE` erhalten.
- Signature-Fähigkeiten kosten Resonanz (neu, aus Attribut abgeleitet).
- `pyro-trail` (Glutspur) ist die eine Fähigkeit mit Wissensnachweis (Angriff ≥ 460, 1 Fähigkeitspunkt, Nachweis „Prozentrechnung“). Alle anderen 15 Fähigkeiten sind von Anfang an bekannt.
- Beschwörer hat eine Mechanik (`rally`).
- Altersband wird im Wissensscreen gewählt (der alte Avatar-Editor-Schritt ist nicht Teil des Slice).

## Spielstände

Ein v22-Stand im `localStorage` wird beim ersten Start einmalig nach v30 migriert und unter `knowsters-save-v30` gespeichert; der alte Schlüssel bleibt unangetastet. Export/Import als JSON über `store.exportJson()` / `store.importJson()` (in der Konsole: `window.knowsters.store`).
