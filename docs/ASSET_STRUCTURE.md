# Asset- und Content-Struktur

Stand: Branch `claude/3d-pilot-v1`, nach Art & Asset Bible v1 (§11–§14). Prinzip: **Content = was existiert · Rules = was es regeltechnisch tut · Renderer = wie es aussieht.**

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
  creatures/                  Ziel: <species>/<species>.glb   (leer)
  humans/                     Ziel: base/, clothing/          (leer)
  placeholders/               fox.glb, cesium-man.glb         (Khronos, CC-BY 4.0, markiert)
environments/                 Ziel: lichtquell/, bridge/, workshop/ (leer; Werkhalle ist prozedural)
textures/{shared,characters,environments}
vfx/                          (Partikeltexturen sind derzeit prozedural)
ui/  audio/                   (leer)
manifests/pilot.json          Species → Modell, Scale, Tint, yawOffset, Animationsvertrag
icons/
```

## Source-Assets (`art-source/`, nicht im Repo)

Authoring-Dateien (Blender, PSD, Texturen in Rohgröße) gehören per Git LFS oder in eine getrennte Ablage. Vorgeschlagene Struktur siehe Bible §11. Im Repo liegen nur Runtime-Exporte (GLB, WebP, Manifeste).

## Animationsvertrag (Bible §7)

`idle · move · basic_attack · hit · defend · skill_01…skill_04 · victory · down` plus `command` für den Menschen. Das Manifest mappt Vertragsnamen auf Clip-Namen im GLB; `*` = erste AnimationGroup. Fehlende Clips werden vom Actor als prozedurale Overlays ersetzt und im Presenter-Log genannt (`window.pilot.presenter.log`).

## Namenskonvention Dateien

`pyro.glb`, `pyro_albedo.webp`, `pyro_normal.webp`, `pyro_roughness.webp`, `workshop_arena.glb`. Bodenlinie = Ursprung (Y = 0), Blickrichtung +Z, Maßstab: 1 Einheit = 1 Feld (~1 m).
