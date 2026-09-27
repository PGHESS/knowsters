# Grundangriffe

Stand: Branch `claude/3d-pilot-v1`, Phase B. Alle Zahlen sind **Pilotwerte** (`pilot: true` in den Definitionen), kein Balancing.

## Regel

Jedes Wesen besitzt genau einen Grundangriff (Art & Asset Bible §8):

- immer verfügbar, solange das Wesen handeln darf,
- keine Resonanzkosten,
- belegt keinen der vier Skill-Slots,
- eigene Content-Definition (`packages/content/src/creatures/basic-attacks.ts`),
- eigene Regel (`actionBasicAttack` in `packages/rules/src/battle/engine.ts`),
- eigenes Event (`basic-attack` mit `ability`, `unit`, `targetId`, `targetPos`, `amount`),
- Schaden = Basis + Angriffsbonus (aus dem Attribut Angriff) + „Entfacht“ (+2) + „Analysiert“ (+2), berechnet ausschließlich im Regelkern.

Auch **Gegner** haben einen content-definierten Grundangriff (`attack.rush.basic` „Drängen“ 3, `attack.flicker.basic` „Flackern“ 2, `attack.brute.basic` „Verdichten“ 3, alle Reichweite 1). Die KI wählt ihn automatisch: Ziel ist der Wächter mit den wenigsten LP in Reichweite; das Event bleibt `enemy-hit`, trägt aber jetzt `ability`. Damit haben alle Wesen dieselbe Struktur für Schaden, Reichweite, Animation und VFX. Das alte Feld `damage` auf Gegner-Species ist als deprecated markiert und wird aus der Definition befüllt.

Bedienung: Modus `basic` (`setMode(state, 'basic')`), gültige Ziele über `validTiles(state, id, 'basic')`, Ausführung über `tile(state, x, y)` auf einem Gegnerfeld. Gegnerangriffe laufen nicht über den Spieler-Aktionssatz, sondern über die KI (siehe oben).

## Definitionen

| ID | Wesen | Name | Art | Reichweite | Basisschaden | Animation | VFX |
|---|---|---|---|---|---|---|---|
| `attack.pyro.basic` | Pyro | Flammenklaue | fire | 1 | 2 | `basic_attack` | `vfx.fire.hit.small` |
| `attack.lumi.basic` | Lumi | Lichtimpuls | light | 2 | 1 | `basic_attack` | `vfx.light.hit.small` |
| `attack.terra.basic` | Terra | Pranke | earth | 1 | 2 | `basic_attack` | `vfx.earth.hit.small` |
| `attack.nivaro.basic` | Nivaro | Energieimpuls | energy | 2 | 1 | `basic_attack` | `vfx.energy.hit.small` |
| `attack.rush.basic` | Dränger (Gegner) | Drängen | physical | 1 | 3 | `basic_attack` | `vfx.noise.hit.small` |
| `attack.flicker.basic` | Flimmerer (Gegner) | Flackern | energy | 1 | 2 | `basic_attack` | `vfx.noise.hit.small` |
| `attack.brute.basic` | Verdichter (Gegner) | Verdichten | physical | 1 | 3 | `basic_attack` | `vfx.noise.hit.small` |

Nahkämpfer treffen härter, Fernangriffe sind schwächer, aber sicherer. Das Verhältnis zu den Fähigkeiten (Flammenstoß 4, Fokusstrahl 3) ist bewusst so gewählt, dass der Grundangriff nie die bessere Wahl gegenüber einer passenden Fähigkeit ist, aber nie nutzlos.

## Kampfaktionssatz (Bible §8)

1. Bewegen
2. Grundangriff
3. vier ausgerüstete Fähigkeiten
4. Beschwörerkommando (`human.command.rally`, Chip beim Menschen)
5. Warten

## Tests

`packages/rules/tests/basic-attack.test.ts`:

- jedes Wesen hat genau einen Grundangriff, markiert als Pilotwert,
- immer verfügbar: funktioniert mit Resonanz 0, nicht Teil der Fähigkeitenliste, kostet nichts,
- Reichweite wird im Regelkern geprüft (Flammenklaue reicht nicht über zwei Felder),
- Schaden nur im Regelkern (Analyse und Entfachen fließen ein, das Event trägt den Wert),
- Lichtimpuls reicht zwei Felder; Gegnerangriffe sind nicht Teil des Spieler-Aktionssatzes,
- Gegner-KI greift über ihren Grundangriff an (Event `enemy-hit` mit `ability`, Schaden aus der Definition),
- ältere gespeicherte v30-Kämpfe ohne `basicAttack` werden beim Hydratisieren aus der Species ergänzt.

## Presenter

Phaser-BattleScene: Button „⚔ ANGRIFF“, Ziele leuchten orange, Event `basic-attack` spielt Lunge + Treffer + Funken. Babylon-Pilot: Event → `basic_attack`-Animation (bzw. Platzhalter-Overlay) + VFX-Schlüssel aus der Definition.
