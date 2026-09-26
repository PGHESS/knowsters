# Knowsters – Mobile UX Blueprint v1

Stand: 26.09.2026
Status: verbindliche Produkt- und UX-Grundlage für den nächsten Umbau

## 1. Produkt-Nordstern
Knowsters wird als **Mobile-first Creature-Tactics-RPG** entwickelt.

Das Spiel soll sich auf dem Handy wie ein eigenständiges Game anfühlen, nicht wie eine Website mit Spielkomponenten.

Kernversprechen:
- Du spielst einen sichtbaren menschlichen Beschwörer / Freund der Wesen.
- Ein Wesen begleitet dich sichtbar in der Welt; bis zu vier gehören zum aktiven Team.
- Erkundung, Beziehung, Wissen und taktische Kämpfe greifen ineinander.
- Wissen entwickelt den Spieler; Entwicklungspunkte und Potenzial formen die einzelnen Wesen.
- Die Welt reagiert auf das „Rauschen“ und verändert sich visuell, erzählerisch und spielmechanisch.

## 2. Verbindliche UI-Regeln

### 2.1 Spielwelt vor Oberfläche
- Welt und Kampf füllen den Bildschirm.
- UI liegt als HUD **über** der Welt und nimmt nur so viel Platz ein wie nötig.
- Keine großen Browser-Panels während aktiver Spielsituationen.
- Keine dauerhaften Fließtexte im aktiven Gameplay.

### 2.2 Information on demand
- Primärinfo sichtbar: LP, Zug, Ziel, aktive Aktionen.
- Sekundärinfo hinter `i`-Symbol, Tap-and-hold, Team-Screen oder Tutorial-Overlay.
- Skillbeschreibungen nicht dauerhaft im Kampf.
- Attribute nicht dauerhaft in der Weltansicht.

### 2.3 Touch first
- Häufig genutzte Touchziele ca. 44×44 pt oder größer.
- Hauptaktionen in Daumennähe.
- Sekundäre Menüs oben / in Overlays.
- Safe Areas für Dynamic Island, Rundungen und Home Indicator.

### 2.4 Eine Hauptaktion pro Screen
- Home: Weiter / Spielen.
- Welt: Bewegen / Interagieren.
- Kampf: Bewegen oder Fähigkeit ausführen.
- Lernen: Aufgabe lösen.
- Team: Wesen auswählen / entwickeln.

## 3. Orientierung

### V1-Entscheidung
**Portrait-first für das gesamte Spiel.**

Begründung:
- konsistentes Mobile-Gefühl,
- einfacher Wechsel zwischen Welt, Team und Lernen,
- weniger Orientierungswechsel,
- Store-Screenshots und App-Preview lassen sich konsistent gestalten.

Kampf wird zunächst ebenfalls Portrait-first gedacht. Das taktische Feld bekommt dafür mehr Höhe statt immer mehr Breite. Für Tablets / Desktop wird die Szene responsiv erweitert.

Die bestehende 8×6-Prototypkarte bleibt zunächst als Regeltest erhalten. Beim Phaser-Spike wird geprüft, ob ein 7×7- oder 6×8-Layout für Mobile besser funktioniert.

## 4. Hauptscreens

### 4.1 Boot / Splash
Sichtbar:
- Knowsters-Logo
- atmosphärische Key-Art
- kurzer Ladebalken
- optional ein kurzer Tipp / Lore-Satz

Nicht sichtbar:
- technische Ladeinfos
- Dateinamen
- Browser-UI

### 4.2 Home Hub
Ziel: emotionaler Startpunkt statt Menüseite.

Sichtbar:
- menschlicher Avatar groß im Raum
- aktives Begleitwesen neben / hinter ihm
- Welt-/Stadthintergrund passend zum letzten Aufenthaltsort
- eine dominante Taste: **Weiter**
- kompakte Schnellzugriffe: Team, Wissen, Journal, Stil
- kleiner Fortschrittsindikator / Kapitel

Nicht sichtbar:
- lange Tabellen
- ausführliche Erklärtexte
- mehr als 4–5 Hauptbereiche gleichzeitig

### 4.3 Welt / Adventure
- Fullscreen-Welt.
- Mensch ist steuerbare Figur.
- ein ausgewähltes Wesen folgt sichtbar.
- Bewegung per dynamischem Touch-Joystick oder Tap-to-Move (Testentscheidung).
- Interaktion kontextuell unten rechts.
- aktuelles Ziel als kleiner Chip / Icon.
- keine dauerhafte Navigationsleiste, wenn sie die Welt verdeckt; sie darf bei Ruhe einblendbar sein.

### 4.4 Kampf
Zielbild: Mischung aus klarer Mobile-Lesbarkeit und taktischer Tiefe.

Sichtbar:
- taktische Arena dominiert den Screen,
- menschlicher Beschwörer an der eigenen Rückseite,
- gegnerischer Anführer / Ursprung des Rauschens an der Gegenseite,
- Teamwesen als tatsächliche Figuren auf dem Feld,
- kleiner HUD oben: Runde / Ziel,
- schmale Aktionsleiste unten,
- Bewegung / Reichweite direkt im Feld,
- Statusinformationen als kleine Marker.

Nicht sichtbar:
- große Überschrift,
- rechte Informationsspalte,
- lange Skilltexte,
- permanentes Combat-Log.

### 4.5 Team
- großes Wesenmodell / Portrait,
- Teamplätze 1–4,
- Rollen auf einen Blick,
- Attribute als RPG-Werte,
- Skills und Stil als Unterbereiche,
- Details per Tap.

### 4.6 Wissen
- Aufgabe im Mittelpunkt,
- wenig Dekoration während der Antwort,
- nach Antwort: klares visuelles Feedback,
- falsche Antwort: Antworten sperren, korrekt markieren, Erklärung, ähnliche neue Aufgabe,
- richtige Antwort: Attribut-/Wissensfortschritt animiert sichtbar.

### 4.7 Story / Dialog
- Welt / Figuren bleiben sichtbar.
- Dialogbox im unteren Bereich.
- maximal 2–4 Optionen gleichzeitig.
- längere Lore ins Journal.

## 5. Globale Navigation

### Metabereiche
Maximal vier feste Ziele:
1. Home
2. Welt
3. Team
4. Wissen

Skills und Kleidung liegen innerhalb von Team / Profil, nicht als gleichwertige Haupttabs.

Während Kampf, Dialog, Comic und Tutorial verschwindet die globale Navigation.

## 6. Kampfsteuerung

### 6.1 Zugablauf
1. aktives Wesen wird visuell hervorgehoben,
2. erreichbare Felder erscheinen dezent,
3. Tap auf Feld = Bewegung,
4. Tap auf Skill = gültige Ziele / Felder,
5. Tap auf Ziel = Fähigkeit ausführen,
6. kurze Animation + Ergebnis,
7. nächstes Wesen.

Kein zusätzlicher Bestätigungsdialog für normale Aktionen.
Bestätigung nur für besonders seltene / irreversible Aktionen.

### 6.2 Bottom Action Bar
- Wesenportrait / LP klein,
- Move,
- vier aktive Skills,
- Warten / Ende,
- Icons + kurze Namen,
- Skilldetails per Hold oder Info-Icon.

## 7. Summoner-Rolle

Der Mensch ist sichtbar, aber zunächst **kein normaler Kämpfer**.

Funktion:
- Identifikation des Spielers,
- Teamführung,
- später mögliche Kommandofähigkeiten / Team-Buffs,
- Reaktionen auf Sieg, Schaden, Level-up,
- kosmetische Präsenz im Kampf.

Eigene Seite: hintere Kampflinie / Kommandoposition.
Gegnerseite: je nach Gegner menschlicher Anführer, fremdes Wesen oder Rauschen-Knoten.

## 8. Kampffeld-Design

### 8.1 Regel
Das Grid wird nie als neutrales UI-Brett über die Welt gelegt.
Die Felder **sind Teil der Umgebung**.

Beispiele:
- Lichtquell: Pflaster / Metall / Lichtfugen,
- Brücke: Steinplatten / Bruchstellen / Geländer,
- Werkstatt: Stahlplatten / Kabel / Energieflächen,
- Wald: Erde / Wurzeln / Moos,
- Eis: gefrorene Platten / Risse,
- Ruinen: Stein / Schutt / alte Symbole.

### 8.2 Lesbarkeit
- taktische Grenzen bleiben klar,
- aber Material, Licht und Props machen die Felder glaubwürdig,
- Hindernisse brauchen physische Darstellung,
- Deckung muss aus der Welt erklärbar sein.

## 9. Animationen

### 9.1 Idle
Jedes Wesen erhält kleine Loops:
- Atmen,
- Blickbewegung,
- Schwanz / Ohren / Flügel,
- Element-Partikel,
- Gewichtsverlagerung.

Dauer ca. 3–6 Sekunden, nicht hektisch.

### 9.2 Bewegung
- kurzer Anticipation-Moment,
- Bewegung klar lesbar,
- kleine Settle-Bewegung am Ziel,
- keine unnötig langen Laufsequenzen.

### 9.3 Angriff
Ablauf:
- Vorbereitung,
- Effekt / Projektil / Impuls,
- Trefferreaktion,
- sehr kurzer Hit-Stop,
- Zahl / Status,
- Rückkehr in Idle.

### 9.4 Geschwindigkeit
Optionen später:
- 1×
- 2×
- reduzierte Animation

## 10. Tutorial-System

Tutorials werden **nicht** als permanente Erklärungstexte gezeigt.

Stattdessen:
- Spotlight auf relevantes Element,
- maximal 1–2 Sätze,
- Pfeil / Puls,
- Spieler führt Aktion selbst aus,
- danach verschwindet das Tutorial,
- jederzeit im Hilfe-Menü erneut aufrufbar.

Beispiel:
„Pyro erreicht heute drei Felder.“
→ erreichbare Tiles leuchten.
→ kein großer Textblock über dem Kampf.

## 11. Art Direction

### Arbeitsbegriff
**Urban Fantasy Creature Tactics**

### Charakteristik
- stilisiert, aber nicht kindlich,
- kräftige Silhouetten,
- hochwertige 2.5D-Illustrationswirkung,
- Licht / Atmosphäre wichtiger als UI-Rahmen,
- Wesen von niedlich bis cool, majestätisch, fremdartig, massiv.

### Menschliche Avatare
- moderner Urban-/Utility-Look,
- individualisierbar,
- nicht nur Fantasy-Rüstung,
- kleine magische / technologische Akzente.

## 12. Technische Zielarchitektur

### Kurzfristig
Aktueller HTML/CSS/JS-Prototyp bleibt spielbar und dient als Regel-/UX-Labor.

### Ab dem nächsten Rendering-Spike
**Hybrid-Ansatz:**
- Phaser + TypeScript für Welt und taktischen Kampf,
- HTML/CSS für Lernscreen, Teammanagement und textlastige Overlays,
- Spielregeln bleiben UI-unabhängige Daten-/Regelmodule,
- State-/Save-System bleibt migrationsfähig,
- Capacitor später als nativer Container für iOS / Android.

Warum jetzt:
Der DOM-Prototyp ist für Regeln gut, aber bei Kamera, Sprite-Animation, Partikeln, Tiefe, komplexen Arenen und Mobile-Performance wird er zunehmend zum Limit.

## 13. Technische Qualitätsziele
- 60 fps auf Referenzgerät als Ziel, 30 fps nicht dauerhaft unterschreiten.
- Eingabe sichtbar innerhalb von ca. 100 ms.
- Touchziele bevorzugt >= 44×44 pt.
- Safe Areas überall.
- keine Gameplay-Information ausschließlich über Farbe.
- reduzierte Bewegung optional.
- Sound / Musik / Haptik getrennt regelbar.

## 14. Veröffentlichung / Marketing

Store-Material muss echtes Gameplay zeigen.

Drei erste Marketingmotive:
1. Mensch + Begleitwesen in Lichtquell,
2. taktischer Kampf mit klarer Arena und Signature-Skill,
3. Wissen → sichtbarer RPG-Fortschritt eines Wesens.

Erste Sekunden eines App-Preview-Clips:
- kein Logo für 8 Sekunden,
- sofort Bewegung / Welt,
- kurzer Kampf-Impact,
- Wesenentwicklung / Level-up.

## 15. Roadmap ab v24

### V24 – Game Shell & Home Hub
- Home Hub als echter Game-Screen,
- nur vier Hauptbereiche,
- globales HUD reduzieren,
- Team / Stil / Skills logisch bündeln,
- Beschwörer im Kampf sichtbar machen.

### V25 – Phaser Rendering Spike
- eine Welt-Szene + eine Kampfarena in Phaser / TypeScript,
- Touch, Kamera, 8 Einheiten, Partikel, Animation,
- Performancevergleich mit DOM-Version.

### V26 – World Scene
- Mensch bewegen,
- Begleiter folgen,
- NPCs / Interaktion,
- regionabhängige Visuals.

### V27 – Tactical Battle Scene
- mobile Arena,
- Bewegung, Zielvorschau, Hindernisse,
- Summoner + 4 Wesen,
- Gegner-KI,
- Signature-Skills.

### V28 – Knowledge / RPG Progression UX
- Lernen als Game-Screen,
- Attributfeedback,
- Skill-Freischaltungen,
- Wissensnachweise.

### V29 – Audio, Haptics, Accessibility, Performance
- Soundscape,
- haptisches Feedback,
- Speed / Reduced Motion,
- Gerätematrix.

### V30 – Alpha Packaging
- Capacitor-Projekt,
- iOS / Android Testbuild,
- App-Icon / Splash / Store-Preview-Vorbereitung.

## 16. Claude / zweites Modell
Ein zweites Modell ist aktuell **nicht als zweite Produktleitung nötig**. Das erhöht eher die Gefahr widersprüchlicher Architekturentscheidungen.

Sinnvoll wäre Claude oder ein anderes Modell später gezielt für:
- unabhängigen Code-Review des Phaser-Spikes,
- Performance-/Architektur-Kritik,
- Testfall-Generierung.

Die Produktlinie bleibt in einer Hand und in diesem Blueprint verbindlich.
