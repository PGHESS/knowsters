# Asset- und Content-Struktur

Stand: Branch `claude/3d-pilot-v2` (Issue #3), nach Art & Asset Bible v1 (§11–§14). Prinzip: **Content = was existiert · Rules = was es regeltechnisch tut · Renderer = wie es aussieht.**

## Content (`packages/content/src`)

```
attributes.ts                 zehn Attribute, Potenzialmodell, Ableitungstabelle
creatures/
  species.ts                  Wächter (Lumi, Pyro, Terra, Nivaro) und Gegner (Dränger, Flimmerer, Verdichter)
  basic-attacks.ts            Grundangriffe attack.<species>.basic (Pilotwerte)
  abilities.ts                16 Fähigkeiten mit Voraussetzungen
  passives.ts                 Registry (noch leer)
humans/
  commands.ts                 human.command.rally (Regel: engine.rally)
  abilities.ts                Registry (noch leer)
combat/
  statuses.ts                 status.analyzed / rooted / ignited / anchored / shield
  terrain-effects.ts          terrain.wall / ember / lighttrace
world/
  regions.ts                  region.lichtquell, region.bridge
  boards.ts                   bridge-8x6 (Referenz), bridge-6x7, workshop-6x7
  encounters.ts               prolog-bridge, workshop-flicker, pilot-3d
knowledge/
  curriculum.ts               10 Fächer × 8 Stufen, Altersbänder
  questions.ts                Itemformat + 164 Legacy-Items
data/*.json                   per Skript aus dem Legacy-Code extrahiert
```

Bestehende IDs (`pyro`, `pyro-flame`, `workshop-6x7`, …) wurden **nicht** umbenannt, um Migrationen zu vermeiden. Neue Entitäten folgen der Bible-Konvention (`attack.pyro.basic`, `human.command.rally`, `status.analyzed`, `terrain.ember`, `region.lichtquell`). Eine Umstellung alter IDs auf `creature.pyro` / `ability.pyro.flame` ist als eigener Schritt mit Save-Migration möglich.

## Rules (`packages/rules/src`)

```
battle/engine.ts    Befehle, Fähigkeiten, Grundangriff, Zugreihenfolge, Gegner-KI, Events
battle/types.ts     BattleState, BattleUnit, BattleEvent
progression/        Attribute, Wesen, Wissen, Entwicklung, Prüfung
questions/          Generatoren + Pool-Auswahl
terrain.ts          Polygone + A*
save/               Schema v30, Migrationen, Adapter
```

Die in der Bible skizzierte Aufteilung `battle/{engine,commands,effects,targeting,ai}` ist vorbereitet, aber noch eine Datei (`engine.ts`, ~600 Zeilen). Aufspalten, sobald weitere Fähigkeiten/Statuseffekte dazukommen.

## Runtime-Assets (`apps/game/public/assets`, vom Pilot per `publicDir` mitbenutzt)

```
creatures/                    2D-Freisteller (Phaser-Slice)
backdrops/                    2D-Backdrops (Phaser-Slice)
models/
  creatures/pyro/pyro.glb     PRODUKTION (Ziel, Issue #3) – README.txt im Ordner
  creatures/rush/rush.glb     optionaler Vergleichsgegner
  humans/base/human_base.glb  PRODUKTION (Ziel)
  placeholders/               fox.glb, cesium-man.glb (Khronos, CC-BY 4.0, markiert; THIRD_PARTY_ASSETS.md)
environments/
  workshop/workshop_arena.glb PRODUKTION (Ziel); bis dahin prozedural (scene/environment.ts)
textures/{shared,characters,environments}
vfx/                          (Partikeltexturen sind derzeit prozedural)
ui/  audio/                   (leer)
manifests/pilot.json          Manifest v2: Schlüssel → Produktionsdatei + fallback → Platzhalter
icons/
```

## Manifest v2 (`manifests/pilot.json`)

- `models.<key>`: `role` (`creature` | `human`), `file`, `placeholder`, `scale`, optional `fallback` (Schlüssel eines Ersatzmodells), `anims` (nur Platzhalter: Vertragsname → Clip-Name, `null` = fehlt, `*` = erste Gruppe), `tint`/`emissive`/`yawOffset` (nur Platzhalter), `source`.
- `environments.<key>`: `file` (`null` = prozedural), `placeholder`, `scale`, `yawOffset`, `fallback`.
- Auflösung zur Laufzeit (`apps/pilot3d/src/assets/registry.ts`): Produktionsdatei per HEAD prüfen → vorhanden: laden; fehlt: Diagnose `warn` + nächster Schlüssel der Fallback-Kette. Jede Datei wird genau einmal als `AssetContainer` geladen; Einheiten werden daraus instanziiert (Geometrie/GPU-Texturen geteilt).
- Strukturprüfung: `validateManifest` (Rollen, Fallback-Ketten, Platzhalter-Quellen) läuft beim Start und im Test.

## Source-Assets (`art-source/`, nicht im Repo)

Authoring-Dateien (Blender, PSD, Texturen in Rohgröße) gehören per Git LFS oder in eine getrennte Ablage. Vorgeschlagene Struktur siehe Bible §11. Im Repo liegen nur Runtime-Exporte (GLB, WebP, Manifeste).

## Animationsvertrag (Bible §7, Issue #3 Punkt 4/5)

Quelle: `apps/pilot3d/src/assets/contract.ts` (DOM-frei, getestet).

| Rolle | Pflicht | Optional |
|---|---|---|
| creature | `idle · move · basic_attack · hit · skill_04 · down` | `defend · skill_01 · skill_02 · skill_03 · victory` |
| human | `idle · move · command` | `victory · down` |

Clip-Name im GLB = Vertragsname (exakt, Kleinschreibung). Ein Produktionsasset ohne Pflichtclip erzeugt eine Diagnose `error` (Panel im Pilot, `?strict=1` blockiert den Start, `npm run check:assets` schlägt in CI fehl). Platzhalter dürfen Clips fehlen (prozedurale Overlays, Diagnose `info`). Der Presenter spielt: `idle` in Ruhe, `move` beim Gehen, `basic_attack` beim Grundangriff, `skill_04` beim Signature-Cast, `hit` beim Treffer, `down` beim Ausscheiden, `command` beim Beschwörer-Kommando.

## Exportvertrag GLB (verbindlich)

- Format: `.glb` (binär), Texturen eingebettet (PNG/JPEG/WebP), Größe ≤ 2048², Zweierpotenzen.
- Achsen: Blickrichtung **+Z**, Bodenlinie **Y = 0**, Modell mittig über dem Ursprung, **1 Einheit = 1 Feldmeter**. Plausible Höhe: Wesen 0,5–1,8 m, Mensch 1,5–2,0 m (Prüfskript meldet Abweichungen).
- Rig: ein Skelett je Charakter; Clips benannt wie oben; Idle ≤ 6 s, Aktionen ≤ 2 s.
- Erweiterungen, die der Pilot lädt: `KHR_materials_emissive_strength`, `KHR_texture_transform`, `KHR_mesh_quantization`, `KHR_materials_unlit`, `KHR_lights_punctual`, `EXT_texture_webp`. **Keine** Draco-, Meshopt- oder KTX2/Basis-Kompression.
- Budgets (Warnung): Wesen ≤ 20 k Dreiecke, Mensch ≤ 25 k, Arena ≤ 120 k; Datei ≤ 8 MB (Arena ≤ 24 MB).
- Arena: Ursprung = Brettmitte, Spielfläche bei Y = 0 (Bodenplatte nach unten), Reihe 0 (Gegnerseite) in +Z, Ausdehnung ≥ 6×7 m (Prüfskript prüft). Props im DCC-Tool zusammenfassen (kein GPU-Instancing im Pilot).

Prüfen: `npm run check:glb -- <datei> --role creature|human|arena` (Phase 1 ohne Rig: `--stage static`) · alle gelieferten Produktionsassets: `npm run check:assets` (Teil von `verify` und CI).

Normieren (KI-Exporte sind am Ursprung zentriert und beliebig groß): `node scripts/normalize-glb.mjs <in.glb> <out.glb> --height 0.9 --yaw 0 --name pyro` legt einen Wurzelknoten mit Skalierung, Yaw und Verschiebung über die Szene (Bodenlinie 0, mittig, Zielhöhe, Blick +Z), ohne Geometrie oder Texturen anzufassen. Meshy exportiert bereits mit Blick +Z (yaw 0).

## Namenskonvention Dateien

`pyro.glb`, `pyro_albedo.webp`, `pyro_normal.webp`, `pyro_roughness.webp`, `workshop_arena.glb`. Bodenlinie = Ursprung (Y = 0), Blickrichtung +Z, Maßstab: 1 Einheit = 1 Feld (~1 m).
