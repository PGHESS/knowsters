# 3D-Pilot (Babylon.js) – Ergebnis und Empfehlung

Stand: 27.09.2026 · Branch `claude/3d-pilot-v1` · App `apps/pilot3d` · URL nach Merge: `https://pghess.github.io/knowsters/pilot/` (Fälle: `?case=1|2|3`)

## Was gebaut wurde

| Baustein | Umsetzung |
|---|---|
| Technik | Babylon.js 9.28, TypeScript strict, Vite, GLB über `@babylonjs/loaders`; teilt `packages/rules` und `packages/content` mit dem Phaser-Slice |
| Architektur | **Babylon ist Presenter.** `BattlePresenter` ruft `setMode / tile / wait / rally / nextEnemyAction` aus `@knowsters/rules`, speichert nichts selbst und spielt die zurückgegebenen Events als Animation/VFX. Keine Schadens-, Reichweiten- oder Siegberechnung in `apps/pilot3d` (grep nach `damage(`, `hp -` in `apps/pilot3d/src` ist leer). |
| Szene | 6×7-Arena „Werkhalle“ prozedural: Metallplatten mit Lichtfugen (Raster kontextuell), Kisten als Hindernisse, Rückwand mit Fenstern und Maschinenband, Energieleitung, Werkbänke, zwei Laternen mit Punktlicht, Nebel |
| Kamera | feste schräge Kampfkamera (ArcRotate, β ≈ 49°, Eingaben deaktiviert), Portrait-Fit auf Brettbreite |
| Licht/Schatten | Sonne mit geblurter Exponential-Shadow-Map (1024), Himmel-Fill, kalter Rim, Kontaktschatten-Disc je Figur, Glow-Layer für Emissives |
| Figuren | 1 Mensch (Beschwörer) hinter dem Team, Pyro, 1 Gegner (Fall 1) · 4 Wesen + 3 Gegner (Fall 2/3) |
| Animation | State-Machine je Actor: Idle ⇄ Move (Crossfade über AnimationGroup-Gewichte), Idle → Attack (Anticipation → Lunge → Hit-Stop → Recovery) → Idle, Idle → Hit (Flash + Rückstoß) → Idle, Command (Heben + Leuchten), Down. Keine harten Pose-Sprünge. |
| Grundangriff | Content + Regel + Event `basic-attack`; im Pilot als Lunge mit Feuertreffer-VFX |
| Signature-Skill | Glutspur (freigeschaltet im Pilot): Cast-Overlay, Glut-Partikel und Emissive-Feld auf dem Zielfeld |
| Summoner-Command | „Sammeln“: Mensch hebt sich, violette Partikelringe auf allen Wächtern, Regel `rally` |
| Tap-Steuerung | Picking auf Feldmeshes; im Bewegungs-/Feldziel-Modus werden nur Felder gepickt; trifft der Strahl ein ungültiges Wesen (eigener Körper vor dem Zielfeld), gilt das Feld dahinter |
| Debug-Overlay | FPS (aktuell / Ø / min), Frame- und Renderzeit, Draw Calls, Dreiecke, Meshes, Texturen + geschätzter Speicher, Skelette, laufende AnimationGroups, Partikelsysteme, Renderauflösung, DPR, Hardware-Scaling, WebGL-Version, GPU-String |

**Modelle sind Platzhalter**: Khronos glTF-Sample-Assets *Fox* (alle Wesen, getönt) und *CesiumMan* (Mensch), beide CC-BY 4.0, markiert im Manifest und im Screen; vollständige Attribution in `THIRD_PARTY_ASSETS.md`. Fehlende Clips (`basic_attack`, `hit`, `command`, Idle des Menschen) laufen als prozedurale Overlays. **Aus diesen Modellen ist keine Aussage zur Zielgrafik ableitbar.**

## Messungen

Umgebung: Playwright-WebKit 18.2, iPhone-13-Profil (390×664 CSS, DPR 3), **Software-Rendering ohne GPU auf dem Entwicklungsrechner**. Die Werte belegen Funktion und Lastverteilung, **nicht** die Gerätequalität. Hardware-Scaling war 0.5 (Render 780×1328).

| Fall | Inhalt | fps (Ø / min) | Frame / Render | Draw Calls | Dreiecke | Meshes | Texturen | Skelette / Anims | Partikel |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mensch + Pyro + 1 Gegner | 26 / 4–7 | 5.5–7 ms / 2.3–3 ms | 179–183 | 21–27 k | 85 | 12–13 ≈ 19.5 MB | 3 / 5 | 1–6 |
| 2 | Mensch + 4 Wesen + 3 Gegner | 25 / 9 | 7.3 ms / 2.8 ms | 211 | 35.9 k | 100 | 23 ≈ 39.5 MB | 8 / 19 | 4 |
| 3 | Fall 2 + Auren auf allen Einheiten | 24 / 9 | 7.8 ms / 3.0 ms | 214 | 35.9 k | 100 | 23 ≈ 39.5 MB | 8 / 19 | 7 |

Qualitätsziel: 60 fps auf dem Referenz-iPhone, sonst fester 30-fps-Fallback statt unruhiger 40–50 fps (Frame-Limiter und Hardware-Scaling sind in Babylon verfügbar, im Pilot noch nicht aktiviert).

Einordnung: Frame- und Renderzeit liegen bei 6–8 ms, die niedrigen fps im Software-WebKit stammen aus Compositing/Software-GL des Testrechners (min-Werte sind Ladephasen). Draw Calls wurden durch Mesh-Merging von 387 auf ~180 gesenkt (Schrauben, Fugen, LEDs). Der Texturspeicher besteht überwiegend aus Shadow-Map, Glow-Targets und je einer 1024²-Fox-Textur pro Instanz (glTF-Loader dedupliziert nicht über Ladevorgänge; für Fall 2 lohnt Instanz-Sharing).

**Gerätemessungen (offen, bitte nachtragen):**

| Gerät | Fall | fps Ø / min | Draw Calls | Render-Auflösung | Bemerkung |
|---|---|---|---|---|---|
| iPhone (Modell?) | 1 / 2 / 3 | – | – | – | Safari, `?case=n` |
| Android Mittelklasse (Modell?) | 1 / 2 / 3 | – | – | – | Chrome |

Ablesen: Overlay oben links; oder in der Konsole `pilot.snapshot()`.

## Bundle

`apps/pilot3d/dist`: 5,98 MB JS (gzip 1,28 MB), weil `@babylonjs/core` über den Root-Einstieg komplett gebündelt wird. Bekannte Optimierung: Subpfad-Imports (`@babylonjs/core/Meshes/meshBuilder`, …) und Side-Effect-Registrierung nur der genutzten Komponenten; Erfahrungswert 1,5–2,5 MB. Für den Pilot bewusst nicht gemacht, um keine Laufzeitfehler durch fehlende Registrierungen zu riskieren.

## Was der Pilot bewiesen hat

1. Der Regelkern lässt sich ohne Änderung von einem zweiten Presenter fahren; Phaser-Slice und Babylon-Pilot laufen parallel über dieselben Befehle und Events.
2. GLB-Loading, Skelettanimation, Gewicht-Crossfades, Schatten, Glow, Partikel und Picking laufen in WebKit (iOS-Engine) ohne Fehler.
3. Der Kampfaktionssatz (Bewegen, Grundangriff, Fähigkeiten, Warten, Sammeln) funktioniert in 3D mit denselben Regeln.
4. Kontextuelles Raster (Felder nur beim Bewegen/Zielen hervorgehoben) ist umsetzbar; die Fugen tragen die Struktur.

## Was der Pilot nicht beweisen kann

- Zielgrafik (Menschen, Wesen, Materialien): braucht die ersten Produktionsmodelle (Bible §3/§4).
- Geräteleistung: braucht die Messung auf iPhone und Android.
- Weltszene: nicht gebaut (Auftrag Phase E: nur Arena).

## Empfehlung (vorbehaltlich der Gerätemessung)

Aus den vorliegenden Messungen und dem Bauaufwand:

- **Option 2 „Babylon nur für den Kampf“ ist der belastbarste nächste Schritt**, falls Fall 2 auf dem Referenz-iPhone **stabil 60 fps** hält (Ziel) oder sich sauber auf feste 30 fps begrenzen lässt (Fallback; unruhige 40–50 fps sind schlechter als feste 30) und Android-Mittelklasse ≥ 30 fps erreicht. Der Kampf ist der Screen, der von 3D am meisten profitiert (Kreaturenpräsenz, Arena, Skill-Inszenierung), und der Presenter ist fertig. Welt, Lernen, Team und Menüs bleiben vorerst Phaser/DOM.
- **Option 1 „Babylon für Welt + Kampf“** erst, wenn Option 2 auf Geräten steht und ein Human-Rig existiert: Die Welt braucht laufende Menschen, NPCs, Kamera-Follow und deutlich mehr Assets.
- **Option 3 „beim Phaser-Weg bleiben“**, falls die Gerätemessung Fall 1 keine stabilen 30 fps zeigt oder die Asset-Produktion (Rigs, GLB-Export) nicht gesichert werden kann. Dann wäre 2.5D mit Spine der günstigere Weg.

Entscheidungsgrundlage ist die Tabelle oben, sobald sie mit Gerätewerten gefüllt ist. Ohne diese Werte bleibt die Empfehlung eine Präferenz, keine Entscheidung.

## Nächste Schritte nach der Gerätemessung

1. Erstes Produktionsmodell: Pyro (Blender → GLB, Clips `idle · move · basic_attack · hit · skill_04 · down`), Mensch-Basis-Rig mit `idle · move · command`.
2. Bundle auf Subpfad-Imports umstellen; Texturen teilen (Fall 2: 8 Instanzen ↔ 1 Textur).
3. Werkhalle als `workshop_arena.glb` mit gebackenem Licht statt Prozedur.
4. Reihenfolge-Leiste für den Initiative-Modus, Hold-Tooltips für Skills.
5. Bei Option 2: BattleScene-Router im Phaser-Slice gegen den Babylon-Presenter tauschen (gleiche Store-/Save-Anbindung).
