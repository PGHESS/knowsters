# Drittanbieter-Assets und -Bibliotheken

Diese Datei listet alles, was nicht von Knowsters selbst erstellt wurde und über das Repository oder GitHub Pages ausgeliefert wird. Bitte bei jedem neuen Asset ergänzen.

## Modelle (3D-Pilot, Platzhalter)

| Datei im Repo | Quelle | Urheber | Lizenz | Unsere Änderungen |
|---|---|---|---|---|
| `apps/game/public/assets/models/placeholders/fox.glb` | [KhronosGroup/glTF-Sample-Assets – Models/Fox](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox) (glTF-Binary) | Modell © 2014 PixelMannen (tomkranis), Rigging/Animation © 2017 @AsoboStudio und @scurest | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode) | Datei unverändert kopiert. Zur Laufzeit: Skalierung, Farbtönung über `albedoColor`/`emissiveColor` des Materials, Animationsclips „Survey“/„Walk“/„Run“ als `idle`/`move`/`basic_attack`-Ersatz. Steht für alle vier Wächter und drei Gegner. |
| `apps/game/public/assets/models/placeholders/cesium-man.glb` | [KhronosGroup/glTF-Sample-Assets – Models/CesiumMan](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMan) (glTF-Binary) | © 2017 Cesium; das Cesium-Logo auf dem Modell ist eine geschützte Marke (siehe LICENSES/LicenseRef-LegalMark-Cesium.txt im Quell-Repo) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode) | Datei unverändert kopiert. Zur Laufzeit: Skalierung, Drehung (`yawOffset`), einziger Clip als `move` und in Zeitlupe als Idle-Ersatz. Steht für den Beschwörer. |

Beide Modelle sind **technische Platzhalter** (im Manifest `placeholder: true`, im Pilot-Screen eingeblendet). Sie werden durch eigene Modelle ersetzt, sobald Pyro und ein Human-Rig produziert sind, und dann aus dem Repo entfernt.

## Bilder (2D-Slice, Konzept-Assets)

| Dateien | Herkunft | Status |
|---|---|---|
| `apps/game/public/assets/creatures/*.png`, `apps/game/public/assets/backdrops/bridge.webp`, `legacy/v22/assets/*` | KI-generierte Konzeptbilder aus dem bisherigen Projektverlauf (Prompting durch das Team), Freisteller per `scripts/cutout.py` | Eigene Konzept-Assets; werden durch Produktions-Art ersetzt |

## Bibliotheken (per npm, nicht im Repo)

| Paket | Version | Lizenz | Verwendung |
|---|---|---|---|
| phaser | 4.2.1 | MIT | Vertical Slice (2D) |
| @babylonjs/core, @babylonjs/loaders | 9.28.0 | Apache-2.0 | 3D-Pilot |
| @esotericsoftware/spine-phaser-v4 | 4.2.120 | Spine Runtimes License (Nutzung setzt eine Spine-Editor-Lizenz voraus) | nur Rig-Labor (`?lab=rig`), lädt zur Laufzeit das Spineboy-Beispiel von esotericsoftware.com (Beispieldaten, nicht im Repo) |
| vite, vitest, typescript | 8.3.1 / 5.0.2 / 5.9.3 | MIT / MIT / Apache-2.0 | Build, Tests |

## Werkzeuge (nur lokal)

| Werkzeug | Lizenz | Verwendung |
|---|---|---|
| rembg + Modell isnet-general-use | MIT (rembg); Modellgewichte unter eigener Lizenz | `scripts/cutout.py`, Ergebnisse sind eigene Assets |

## Attribution auf der Website

Solange die Platzhalter-Modelle ausgeliefert werden, verweist der Pilot-Screen auf diese Datei; die vollständige Attribution steht hier. Nach dem Austausch der Modelle wird der Abschnitt „Modelle“ geleert.
