# Bekannte Einschränkungen – Vertical Slice v0.1

Stand: 27.09.2026, Branch `claude/vertical-slice-v1`.

## Behoben (M0)

- Phaser-Spike zeigte auf jedem Gerät „Rendering konnte nicht gestartet werden“: `#load-error{display:flex}` überschrieb `hidden`. Fix in `legacy/v25-spike/phaser-spike.css`; der Spike zeigt jetzt echte Diagnose.
- v22-Service-Worker (Scope `/knowsters/`, cache-first ohne Ablauf) verfälschte Handytests. Die neue App entfernt alte Registrierungen und `knowsters-*`-Caches beim Start; Referenzstände liegen unter `/legacy/`.
- Quellen und Tests existierten nur als ZIP bzw. lokal. Jetzt im Repo (`legacy/`, `packages/`, `apps/`), CI führt Typecheck, Tests und Build vor dem Deploy aus.

## Offen – bewusst verschoben (Auftrag §19)

- **Nur ein Wissenspfad vollständig** (Mathematik, 8 generative Stufen). Logik ist generativ, aber ohne UI-Pfad; die sieben Pool-Fächer haben 2–3 Items je Stufe und deshalb keine Prüfung (`examAvailable` blockt). Contentformat und Schema sind fertig; der Fragenbestand ist das Nadelöhr.
- **Ein Encounter, ein NPC, eine Zone.** Kapitel 2–5, Story-Zonen, Comics, Reisebegegnungen, Beziehungssystem und Garderobe/Avatar-Editor sind nicht Teil des Slice (Daten in `legacy/v22` erhalten).
- **Provisorische Grafik**: Lichtquell-Platz und Menschen sind prozedurale Blockouts (Formen, keine Illustration). Wesen sind automatische Freisteller aus KI-Konzeptbildern mit unterschiedlichem Malstil. Brücken-Backdrop ist das alte `battle-clearing`-Bild.
- **Cutout-Rig ist einteilig** (Körper + Effektlayer). Die Spine-Runtime ist integriert und getestet, eigene Rigs brauchen den Spine-Editor (Lizenz) und Handarbeit. Siehe `docs/ASSET_PIPELINE.md`.
- **Kein Service Worker / Offline-Modus** im Slice. Kommt mit einem versionierten Ansatz (Workbox, gehashte Dateien) nach der Abnahme.
- **Kein Capacitor-Projekt** eingecheckt; Pfad in `DEPLOYMENT.md` beschrieben.
- **Kein Audio, keine Haptik.** Reduced Motion wird respektiert (Systemeinstellung), es gibt aber noch keinen Einstellungsscreen (`settings.reducedMotion`, `settings.turnOrder` existieren im Save, nur per Konsole schaltbar).
- **Balancing** der abgeleiteten Kampfwerte, der Entwicklungskosten und des 8.000-Potenzials ist bewusst nicht finalisiert. Die Glutspur-Schwelle (Angriff 460) und der Prüfungsbonus (+10) sind so gewählt, dass der Loop in etwa 10 Minuten erlebbar ist.
- **Initiative-Modus** ist implementiert und getestet, aber ohne Reihenfolge-Leiste im HUD; Standard ist der Seiten-Modus.
- **Gegner-KI** kennt nur „angreifen, sonst vorrücken“. Flimmerer weichen nicht wirklich aus.
- **Willenskraft (Statusresistenz)** ist abgeleitet, wirkt aber noch auf keinen Statuseffekt.
- **PvP, Backend, Accounts, Monetarisierung, Shop, Zucht, Seltenheiten**: nicht begonnen, architektonisch nicht verbaut (Regelkern ist server-tauglich, Save ist ein Interface).

## Technische Hinweise

- Bundle: ~1,6 MB JS (Phaser ist der Großteil), gzip ~426 KB. Spine-Runtime lädt nur im Labor als separater Chunk.
- Performance wurde nur in Playwright-WebKit ohne GPU gemessen (nicht aussagekräftig). Geräteprofil: `?fps=1` auf dem Handy nutzen und Werte in `docs/TESTREPORT.md` nachtragen.
- Der Team-Screen zeigt alle 16 Fähigkeiten, aber nur die Glutspur hat Voraussetzungen. Weitere Wissens-Gates brauchen Content in anderen Fächern.
- Das Ergebnis-Sheet nach dem Kampf bietet bei Niederlage „Nochmal“; ein laufender Kampf kann über „‹“ verlassen und von Home fortgesetzt werden.
- Bei sehr kleinen Viewports (< 360 pt) skaliert Phaser das Canvas per FIT; DOM-Sheets bleiben lesbar, die Canvas-Buttons werden aber kleiner als 44 pt.

## 3D-Pilot (v1 in `main`, v2 auf `claude/3d-pilot-v2`)

- **Modelle sind Platzhalter** (Khronos Fox / CesiumMan), bis `pyro.glb`, `human_base.glb`, `workshop_arena.glb` geliefert sind. Kein Idle-Clip für den Menschen (langsamer Gehzyklus als Ersatz), keine Attack-/Hit-/Command-Clips (prozedurale Overlays). Der Pilot listet das als Diagnose im Screen.
- **Behoben in v2**: Bundle 6 MB → 3,2 MB Build / 2,3 MB geladen (Subpfad-Importe); Texturen je Instanz → ein AssetContainer je Datei (Fall 2: 15,5 MB statt 39,5 MB); fehlende Clips waren still → Diagnosepanel, `?strict=1`, `check:assets` in CI.
- **160 Chunks** im Build (Babylon-Shader als eigene Module). Nur 78 werden geladen; HTTP/2 auf Pages verkraftet das, ein Bundling der Shader in wenige Chunks ist Feinschliff.
- **openPBR-Adapter (~140 KB)** hängt am glTF-Loader 9.x und wird geladen, obwohl der Pilot nur PBR nutzt. Kein Weg ohne Loader-Fork.
- **Keine Draco/Meshopt/KTX2**: bewusst (Decoder-Dateien). Assets müssen unkomprimiert exportiert werden; das Prüfskript meldet `extensionsRequired`.
- **Produktionsmodell ohne Pflichtclips bleibt in der Bind-Pose** (kein stiller Platzhalter-Clip). Absicht, siehe Diagnose.
- **Governor stuft nur abwärts** und misst erst nach 4 s Warmlauf; ein kurzer Hänger (Laden, Shader-Kompilierung) kann in den ersten Sekunden noch nicht abstufen. Hochstufen nur per Reload oder Chip.
- **Frame-Pacing** arbeitet mit rAF-Zeitstempeln; auf 120-Hz-Displays rendert `high` jeden zweiten Frame (Ziel 60). Safari iOS liefert rAF ohnehin mit 60 Hz.
- **Texturspeicher** im Overlay ist eine Schätzung (Breite × Höhe × 4 je GPU-Textur, ohne Mipmaps, inkl. Shadow-Map und Glow-Targets).
- **Keine Gerätemessung**; Software-WebKit-Werte in `docs/3D_PILOT.md` sind nur Funktionsnachweis.
- **Kein Save im Pilot** (Zustand nur im Speicher); Reload = neuer Kampf. Store-Anbindung ist für Option 2 vorgesehen.
- **HUD im Pilot ist ein Minimal-DOM** (kein Info-Overlay je Skill, keine Initiative-Leiste).
- **Werkhalle prozedural**, kein gebackenes Licht; Fenster/LEDs/Fugen sind Boxen mit Emissive. Ein Arena-GLB wird geladen, sobald es liegt (Fixture-getestet); Schatten dann auf alle Arena-Meshes (Kosten je nach Modell).
- **Menschmodell** steht hinter dem Brett ohne eigene Grundfläche; bei sehr breiten Viewports kann er außerhalb des Fits liegen.
