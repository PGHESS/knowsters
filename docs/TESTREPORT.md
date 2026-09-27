# Testreport – Vertical Slice v0.1

Stand: 27.09.2026 · Branch `claude/vertical-slice-v1` · `npm run verify` grün (Exit 0)

## Automatisierte Tests

| Suite | Dateien | Tests | Inhalt |
|---|---|---|---|
| vitest `packages/content` | 1 | 6 | Species/Fähigkeiten-Konsistenz, Potenzialsummen = 8.000, Brett-/Encounter-Platzierungen, 10 × 8 Curriculum, 164 Legacy-Items valide |
| vitest `packages/rules` | 5 | 32 | Kampf (Aufbau, abgeleitete Werte, Seiten-Modus, Wall, Tor halten/Durchbruch, Initiative-Modus, Rally, Resonanz, defeatAll, Impuls-Richtung, JSON-Roundtrip), Progression (800 Potenzialinstanzen, atypische Individuen, Entwicklungskosten, Farming-Schutz, Stufenlogik, Altersband, Prüfung 4/5, Prüfungsbonus, Glutspur-Gating), Aufgaben (960 Mathe-Aufgaben unabhängig nachgerechnet, Logik, Pools, Prüfungssets), Terrain (Polygone, A*, Gleiten), Save (Fresh, Migration v22, Adapter Export/Import) |
| Legacy `legacy/tests-v20` | 7 | 7 Skripte | unveränderte alte Suite gegen den v22-Referenzbuild (960 Matheaufgaben, Prolog, Spielstände, Avatar, Garderobe) |
| Typecheck | 3 Projekte | – | TypeScript strict, `noUncheckedIndexedAccess` |
| Build | – | – | Vite 8, ~1,6 MB JS (gzip 426 KB), Spine-Runtime als separater 245-KB-Chunk nur im Labor |

Gesamt vitest: **38 Tests in 6 Dateien, alle grün.**

## Browser-Durchläufe (Playwright WebKit 18.2, iPhone-13-Profil)

Skripte liegen nicht im Repo (Session-Werkzeug); Ergebnisse und Screenshots unter `docs/screenshots/`.

| Ablauf | Ergebnis |
|---|---|
| Boot → Home | Phaser 4.2.1, WebGL, keine Konsolenfehler, Diagnose-Overlay bleibt verborgen |
| Home → Prolog → Bewegen → Feld → Fähigkeiten → Klarblick auf Gegner → Warten ×3 → Gegnerphase → Runde 2 | Events abgespielt (Bewegung, Analyse-Marker, Spawns), Zustand konsistent, keine Fehler |
| Home → Weiter → Welt → Tap zu Eno → Dialog (3 Schritte) → „Zur Werkhalle“ → Ankunft → Dialog → Kampf | Encounter `workshop-flicker` gestartet; **Reload während des Kampfs setzt in der BattleScene fort** |
| Kampf gewonnen → Ergebnis-Sheet (+1 Fähigkeitspunkt je Wesen) → Weiter → Welt mit gelöstem Flimmern | Flag `won:workshop-flicker`, Kampf aus dem Save entfernt |
| Wissen: Altersband 14–15 → Üben: falsche Antwort sperrt (0 anklickbare Antworten), „Ähnliche Aufgabe“, danach 4 richtige → Stufe 5 → 6, peak 6, Angriff 450 → 452 | Farming-Schutz aktiv, Entwicklung sichtbar |
| Prüfung Stufe 6 (Prozentrechnung), 4/5 richtig → Nachweis `math-percent`, Angriff +3 durch +10 Entwicklung | Nachweis im Spielerprofil |
| Team: Glutspur zeigt fehlende Voraussetzungen (Angriff 453/460, 0 Punkte, Nachweis ✓); nach Angriff 460 + 1 Punkt → „Jetzt lernen“ → gelernt | `pyro-1.unlocked` enthält `pyro-trail` |
| Nächster Kampf: Pyro hat vier Fähigkeiten inkl. Glutspur (1 Resonanz) | Loop geschlossen |
| Rig-Labor: Cutout-Rig Idle/Move/Attack/Cast/Hit; Spine-Runtime lädt (57 ms), Plugin installiert, Spineboy rendert (318 ms) | Runtime-Integration nachgewiesen |

## Abnahmekriterien (Auftrag §22)

| # | Kriterium | Status |
|---|---|---|
| 1 | Frisch geklont, dokumentierte Commands | ✅ `npm ci`, `npm run dev`, `npm run verify` |
| 2 | Tests und Typecheck grün | ✅ |
| 3 | Keine zweite Battle-Rule-Engine in Phaser | ✅ BattleScene ruft nur `@knowsters/rules`; Spike-Regeln nur unter `legacy/` |
| 4 | iPhone Safari zeigt den Build korrekt | ⚠️ WebKit-Engine (Playwright) ja; **echtes iPhone noch nicht getestet** – bitte `?fps=1` nutzen |
| 5 | Portrait Fullscreen wirkt wie Game | ✅ Canvas-Szenen, HUD, Bottom Bar; Lernen/Team/Dialog als Sheets über der Welt |
| 6 | Home → Welt → Encounter → Kampf → Ergebnis → Wissen | ✅ automatisiert durchgespielt |
| 7 | Mensch und Begleitwesen sichtbar | ✅ Home, Welt (folgt), Kampf (Beschwörer hinter dem Team) |
| 8 | Kampf zeigt 4 Wesen + Gegner, nutzt Regelkern | ✅ |
| 9 | Bewegung und Skillziele direkt im Board | ✅ leuchtende Felder, Zielringe |
| 10 | Wissen schaltet echten Skill frei | ✅ Glutspur |
| 11 | Leichte Aufgaben farmen nicht unendlich | ✅ `developmentFor` + Test |
| 12 | Save/Reload konsistent | ✅ laufender Kampf, Welt-Position, Wissen, Wesen |
| 13 | Keine alten SW-Caches verfälschen Tests | ✅ Unregister + Cache-Delete beim Start; kein SW im Slice |
| 14 | Grafischer Asset-Pilot | ✅ Freisteller + Cutout-Rig + Spine-Runtime-Test |
| 15 | Einschränkungen dokumentiert | ✅ `docs/KNOWN_ISSUES.md` |

## Performance

Playwright-WebKit läuft ohne GPU (Software-Rendering, ~28 fps im Labor) und ist **nicht** repräsentativ. Auf Geräten bitte mit `?fps=1` messen und hier nachtragen:

| Gerät | Szene | fps | Renderer | Bemerkung |
|---|---|---|---|---|
| iPhone (Modell?) | Kampf, Runde 2 | – | – | – |
| Android Mittelklasse (Modell?) | Kampf, Runde 2 | – | – | – |

## Screenshots

`docs/screenshots/`: home, world, world-dialog, battle, battle-move-range, battle-skills, battle-result, world-after-victory, battle-glutspur-unlocked, knowledge, knowledge-exam, team, rig-lab.
