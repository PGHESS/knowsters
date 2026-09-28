# 3D-Pilot (Babylon.js) – Ergebnis und Empfehlung

Stand: 28.09.2026 · Branch `claude/3d-pilot-v2` (v1 gemergt in `main`) · App `apps/pilot3d` · URL: `https://pghess.github.io/knowsters/pilot/` (Fälle: `?case=1|2|3`, Preset `?quality=`, Abnahme `?strict=1`)

## v2 – Produktionsreife (Issue #3, Branch `claude/3d-pilot-v2`)

Ziel des Tickets: Babylon so vorbereiten, dass `pyro.glb`, `human_base.glb` und `workshop_arena.glb` nur noch angeschlossen werden müssen. Keine neuen Spielmechaniken, Regelkern unverändert (`git diff main -- packages/rules` ist leer).

| # | Punkt | Umsetzung | Messung (Playwright-WebKit 18.2, iPhone-13-Profil, Software-GL) |
|---|---|---|---|
| 1 | Bundle | Subpfad-Importe über **eine** Datei `apps/pilot3d/src/babylon.ts` (Klassen + alle Side-Effects: Picking, Schatten, Glow, Partikel, glTF-2.0-Loader + 6 Erweiterungen). Kein Root-Import von `@babylonjs/core` mehr. | Build **3,2 MB JS / 797 KB gzip** in 160 Chunks (v1: 5,98 MB / 1,28 MB). Zur Laufzeit geladen: **78 Chunks, 2,28 MB, Transfer 607 KB** (v1: alles). `bundle-info.json` wird beim Build geschrieben. |
| 2 | Gemeinsames Laden | `assets/registry.ts`: jede GLB-Datei wird genau einmal geholt (`fetch` → `LoadAssetContainerAsync`), Einheiten entstehen per `instantiateModelsToScene` (Geometrie und GPU-Texturen geteilt; Skelett und Materialien je Einheit, weil jede Einheit ihre eigene Pose und ihren Treffer-Flash hat). | Fall 2: **2 Dateien, 0,57 MB, 8 Instanzen**; GPU-Texturen 19 (25 Referenzen), **≈ 15,5 MB statt 39,5 MB** (v1: acht Fox-Texturen). |
| 3 | Manifest für Produktionsassets | `pilot.json` v2: `creature.pyro → models/creatures/pyro/pyro.glb`, `human.summoner → models/humans/base/human_base.glb`, `arena.workshop → environments/workshop/workshop_arena.glb`, optional `enemy.rush`; jeder Eintrag hat `fallback` auf einen markierten Platzhalter. Ordner mit README existieren. | – |
| 4 | Animationsvertrag | `assets/contract.ts`: Pflicht creature `idle move basic_attack hit skill_04 down`, human `idle move command`; Clip-Name im GLB = Vertragsname (kein Mapping nötig). Presenter nutzt `skill_04` für den Signature-Cast, `down` beim Ausscheiden. | 11 Vitest-Tests (`apps/pilot3d/tests/contract.test.ts`). |
| 5 | Diagnose statt stiller Fallback | Datei fehlt → `warn` + Fallback; Pflichtclip fehlt bei einem Produktionsasset → `error`. Panel im Screen (rot/gelb), Konsole, `pilot.diagnostics()`; **`?strict=1`** blockiert den Start mit der Liste (Abnahmemodus). Platzhalter werden immer als Hinweis gelistet. | Fixture-Test: Fox-Kopie als `pyro.glb` → „Pflichtclips fehlen: idle, move, … – Abnahme blockiert“; Arena-Fixture (Platte 8×9) → Arena `glb`, Raster nur im Bewegungsmodus sichtbar. |
| 6 | Quality-Presets | `quality.ts`: `high` / `balanced` / `fallback30` (Tabelle unten), **eigener Render-Loop mit Frame-Pacing** statt `runRenderLoop`, Governor stuft ab, wenn der 3-s-Durchschnitt zweimal unter der Schwelle liegt (54 bei Ziel 60). Nie automatisch aufwärts. `?quality=` oder HUD-Chips setzen fest. | Governor in Software-WebKit (13 fps): high → balanced nach 10,7 s → fallback30 nach 20,7 s; bei fallback30 rendert der Loop 26–28 Bilder/2 s (Ziel 30) statt frei zu laufen. |
| 7 | Overlay | + Preset und Grund, Ziel-fps, JS geladen / Build-Größe, GLB-Dateien → Instanzen, GPU-Texturen (Referenzen), Diagnosezähler. | – |
| 8 | Testfälle | `?case=1|2|3` unverändert, zusätzlich `?quality=auto|high|balanced|fallback30` und `?strict=1`; Chips im HUD. | – |
| 9 | Keine neuen Regeln | – | `packages/rules`, `packages/content` unverändert. |

Screenshots: `docs/screenshots/pilot3d/v2-case1-diagnostics.png` (Diagnosepanel, Chips, Overlay), `v2-governor-fallback30.png` (Auto-Abstufung in Fall 2), `v2-arena-glb-fixture-move.png` (Arena aus GLB-Fixture, Raster nur im Bewegungsmodus).

### Quality-Presets

| Preset | Ziel | Render-DPR max | Schatten | Glow | Fall 2 in WebKit-SW: Draw Calls · Renderauflösung · Frame |
|---|---|---|---|---|---|
| `high` | 60 fps | 2.0 | 1024, weich (Blur-ESM) | ja, Kernel 48 | 203 · 780×1328 · 35 ms |
| `balanced` | 60 fps | 1.5 | 512, hart (ESM) | ja, Kernel 24 | 202 · 585×996 · 33 ms |
| `fallback30` | **30 fps fest** | 1.25 | 512, hart | nein | 113 · 487×830 · 24 ms |

Frame-Pacing: Der Loop rendert nur, wenn seit dem letzten Bild ≥ 1000/Ziel ms vergangen sind, und verrechnet den Rest (`elapsed % interval`), damit die Abstände nicht driften. `engine.beginFrame()` misst die Zeit selbst, deshalb bleiben `getDeltaTime()` und alle Animationen bei 30 fps in Echtzeit (33 ms pro Bild). Auch `high` ist auf 60 gedeckelt (120-Hz-Displays rendern nicht doppelt).

Abstufung (auto): 4 s Warmlauf nach jedem Wechsel, dann 500-ms-Messungen; 6 Messungen = 1 Fenster; zwei Fenster unter 54 fps (Ziel 60) bzw. 27 fps (Ziel 30) → nächste Stufe. Unruhige 40–50 fps landen also nach ~10 s in `balanced` und, falls das nicht reicht, in festen 30 fps. Hochstufen passiert nie automatisch (kein Flackern zwischen Stufen).

### Assets anschließen (wenn GLBs geliefert werden)

1. Datei an den Zielpfad kopieren (`apps/game/public/assets/models/creatures/pyro/pyro.glb`, `…/humans/base/human_base.glb`, `…/environments/workshop/workshop_arena.glb`).
2. `npm run check:glb -- <datei> --role creature|human|arena` (Clips, Erweiterungen, Bodenlinie, Höhe, Budgets). `npm run check:assets` prüft alle gelieferten Produktionsassets; läuft auch in CI und im `verify`.
3. `npm run dev:pilot` → `http://localhost:5174/knowsters/pilot/?case=1&strict=1` muss **ohne** Diagnosepanel starten. Ohne `strict` läuft der Pilot mit Panel weiter (zum Sichten).
4. Commit; kein Codeänderung nötig, solange der Vertrag eingehalten ist. Abweichende Clip-Namen könnten per `anims` im Manifest gemappt werden, sind aber für Produktionsassets nicht vorgesehen.

Exportvertrag: GLB (binär, Texturen eingebettet), Blickrichtung +Z, Bodenlinie Y = 0, 1 Einheit = 1 Feldmeter, Skelett + benannte Clips, keine Draco-/Meshopt-/KTX2-Kompression (erlaubte Erweiterungen: `KHR_materials_emissive_strength`, `KHR_texture_transform`, `KHR_mesh_quantization`, `KHR_materials_unlit`, `KHR_lights_punctual`, `EXT_texture_webp`). Arena: Ursprung = Brettmitte, Spielfläche bei Y = 0 (Bodenplatte nach unten), Reihe 0 (Gegnerseite) in +Z, Lichter aus `KHR_lights_punctual` werden übernommen. Details: `docs/ASSET_STRUCTURE.md`.

### Messungen v2 (Software-WebKit, nur Funktions- und Lastnachweis)

| Fall | Preset | fps Ø | Frame / Render | Draw Calls | Dreiecke | Meshes | GPU-Texturen ≈ MB | Skelette / Anims | Partikel | GLB |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | high | 13 | 21 / 10 ms | 180 | 21,2 k | 85 | 14 ≈ 15,5 | 3 / 5 | 1 | 2 Dateien, 0,57 MB, 3 Inst. |
| 2 | high | 7 | 35 / 16 ms | 203 | 27,2 k | 100 | 19 ≈ 15,5 | 8 / 19 | 4 | 2 Dateien, 0,57 MB, 8 Inst. |
| 3 | high | 7 | 34 / 16 ms | 206 | 27,2 k | 100 | 19 ≈ 15,5 | 8 / 19 | 7 | wie 2 |
| 2 | balanced | 8 | 33 / 15 ms | 202 | 27,2 k | 100 | 18 ≈ 10,5 | 8 / 19 | 4 | wie 2 |
| 2 | fallback30 | 9 | 24 / 15 ms | 113 | 22,4 k | 100 | 18 ≈ 14,3 | 8 / 19 | 4 | wie 2 |

Die fps-Werte sind Software-Rendering des Entwicklungsrechners und **keine Geräteaussage**; entscheidend bleibt die iPhone-Messung (Tabelle „Gerätemessungen“). Neu gegenüber v1: Texturspeicher in Fall 2 halbiert, Bundle um 62 % kleiner, `fallback30` halbiert die Draw Calls (kein Glow-Pass).

### Erster Pyro aus Meshy (28.09.2026, Entwurf 1, nicht committet)

Quelle: Meshy Image-to-3D (Multi-View aus GPTs vier Ansichten), Export `Meshy_AI_Emberfox_…_texture.glb`. Meshy liefert am Ursprung zentriert, 1,42 m hoch, Blick +Z, ohne Rig. Normiert mit `node scripts/normalize-glb.mjs <meshy.glb> apps/game/public/assets/models/creatures/pyro/pyro.glb --height 0.9 --yaw 0 --name pyro` (legt nur einen Wurzelknoten mit Transform darüber, Geometrie bleibt). Prüfung `--stage static`: OK mit 2 Warnungen.

| Merkmal | Wert | Bewertung |
|---|---|---|
| Dreiecke | 255 578 | **12× über Budget** (20 k). In Meshy „Remesh“ mit Ziel 15–20 k neu exportieren, bevor es auf ein Gerät geht. |
| Texturen | 3 × 2048² JPEG (Albedo, Metallic-Roughness, Normal) | ≈ 48 MB GPU allein für Pyro. Für Mobile 1024² reichen; 2048² höchstens für den Helden. |
| Datei | 13,45 MB | über 8 MB; nach Remesh ≈ 2–3 MB |
| Bodenlinie / Höhe / Blick | 0 / 0,90 m / +Z | nach Normierung vertragskonform |
| Rig / Clips | keine | erwartet in Phase 1; Phase 2 über Meshy Animate (Vierbeiner) oder Blender |
| Optik im Pilot | Kopf, Augen, vier Pfoten, Mähne, Flammenschweif von allen Seiten stimmig; Silhouette bleibt bei 0,9 m gut lesbar | Renders: `docs/screenshots/pilot3d/pyro-meshy-draft1-{front,side,back,threequarter}.png` |

In Software-WebKit lief Fall 1 mit diesem Modell bei 531 k Dreiecken pro Bild (Schatten-Pass verdoppelt) noch flüssig genug für die Sichtung; für die iPhone-Messung ist erst die reduzierte Version aussagekräftig. Das GLB liegt lokal unter dem Produktionspfad, ist aber nicht committet (14 MB Entwurf); committet wird die Remesh-Version nach GPTs Freigabe.

### Nicht gemacht (bewusst)

- Draco/Meshopt/KTX2: brauchen Decoder-Dateien und mehr Bundle; erst sinnvoll, wenn ein Produktionsasset > 8 MB wird.
- GPU-Instancing für Skinned Meshes: jede Einheit hat ihre eigene Pose; Babylon klont hier (Geometrie geteilt). Für Props im Arena-GLB funktioniert `EXT_mesh_gpu_instancing` nicht (Erweiterung nicht registriert), Props also im DCC-Tool zusammenfassen.
- Ein Produktionsmodell ohne Clips bleibt in der Bind-Pose (kein Platzhalter-Clip als Ersatz) – das ist Absicht: Die Diagnose ist die Abnahmegrundlage.

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

| Gerät | Fall | Preset (auto-Ergebnis) | fps Ø / min | Draw Calls | Render-Auflösung | Bemerkung |
|---|---|---|---|---|---|---|
| iPhone (Modell?) | 1 / 2 / 3 | – | – | – | – | Safari, `?case=n`; Overlay-Zeile 2 zeigt das Preset und den Grund |
| Android Mittelklasse (Modell?) | 1 / 2 / 3 | – | – | – | – | Chrome |

Ablesen: Overlay oben links; oder in der Konsole `pilot.snapshot()`. Bleibt das Preset nach 30 s Kampf auf `high`, ist das 60-fps-Ziel erreicht; landet es auf `fallback30`, ist das der saubere 30-fps-Fallback (fest, nicht 40–50).

## Bundle

v2: `apps/pilot3d/dist` 3,2 MB JS (gzip 797 KB) in 160 Chunks, davon zur Laufzeit 78 Chunks / 2,28 MB (Transfer 607 KB) geladen. Erreicht durch Subpfad-Importe (`src/babylon.ts`); die Shader liegen als eigene Chunks und werden nur bei Bedarf geholt (WGSL-Varianten nie). v1 lag bei 5,98 MB / 1,28 MB gzip durch den Root-Import.

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
