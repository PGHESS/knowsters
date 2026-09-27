# Grafik- und Animationspipeline – Stand Asset-Pilot

## Ergebnis des Piloten (M5)

| Frage | Ergebnis |
|---|---|
| Freisteller | `scripts/cutout.py` (rembg, Modell `isnet-general-use`) liefert aus den KI-Konzeptbildern brauchbare Alpha-Freisteller mit definierter Bodenlinie. Ränder sind gut, feine Glut-/Wasser-Ausläufer werden teils gekappt. Für Produktion: manuelle Nacharbeit. |
| Cutout-Rig | `apps/game/src/rig/CreatureRig.ts`: Container mit Körperebene, Schatten, Aura, Funken. Timelines: Idle (Atmen, Gewichtsverlagerung, Aura-Puls, 3–5 s), Move (Anticipation → Bogen → Settle), Attack (Wind-up → Lunge → Hit-Stop → Rückkehr), Cast, Hit (Flash, Rückstoß), Die. Reduced Motion halbiert Wege und kürzt auf ≤ 90 ms. |
| Spine-Runtime | `@esotericsoftware/spine-phaser-v4@4.2.120` lädt per dynamischem Import (separater Chunk ~245 KB), Plugin per `installScenePlugin`, Spineboy-Beispiel rendert und animiert mit Phaser 4.2.1 (WebKit-Test: 318 ms bis zum ersten Frame). **Runtime-Integration ist damit nachgewiesen.** |
| Lizenz | Runtime ist frei nutzbar, **setzt aber eine Spine-Editor-Lizenz voraus**, um eigene Rigs zu exportieren (Essential einmalig, Professional für Mesh/IK/Pfade; Preise siehe esotericsoftware.com). Ohne Editor gibt es keine eigenen Spine-Assets. |
| Arena | `battle/arena.ts`: Backdrop (gemalt) + Feldplatten aus Material (Steinplatten mit Rissen und goldener Torfuge; Metallplatten mit Lichtfugen) + Props (Geländer, Steinblock, Kisten). Das Raster ist sichtbar, aber Teil der Umgebung. |

## Empfehlung

1. **Produktions-Rigs in Spine** (Essential reicht für Cutout ohne Mesh-Deformation; Professional, sobald Atem-/Fellbewegung per Mesh gewünscht ist). Pro Wesen 8–15 Teile: Kopf, Ohren, Kiefer, Rumpf, Brust, 4 Beine, Schwanz (2–3 Segmente), Element-Layer. Animationen `idle`, `move`, `attack`, `cast`, `hit`, `die` mit den Namen, die `CreatureRig` heute als Methoden hat, damit der Presenter unverändert bleibt.
2. **Bis dahin** bleibt das prozedurale Cutout-Rig aktiv. Es zeigt die Richtung, ohne Lizenzkosten zu erzeugen.
3. **Sprite-Sheets nur für VFX** (Signature-Skills, Treffer, Glut, Lichtspur), 8–12 Frames, per Texture-Atlas.
4. **Stilkonsistenz**: Die sieben Konzeptbilder stammen aus unterschiedlichen KI-Läufen (Malstil, Licht, Kontrast). Vor weiteren Wesen ein Style-Sheet festlegen: Lichtrichtung oben links, Bodenlinie, Silhouettenhöhe (Wächter 100 %, Gegner 90 %), Farbtemperatur je Element.

## Normen (verbindlich ab jetzt)

- Freisteller: PNG RGBA, auf Alpha-Bounding-Box beschnitten, **Bodenlinie = unterer Bildrand**, Höhe 512 px (Skalierung im Spiel über `height`).
- Namensschema: `assets/creatures/<speciesId>.png`, Gegner `enemy-<id>.png`; Spine später `assets/spine/<speciesId>/<speciesId>.{json,atlas,png}`.
- Key Art ohne Text.
- Backdrops 1200 × 800 WebP, `assets/backdrops/<theme>.webp`.

## Reproduktion

```bash
pip install rembg[cpu] pillow
python scripts/cutout.py          # alle sieben Wesen
python scripts/cutout.py pyro     # einzeln
npm run dev  →  http://localhost:5173/knowsters/?lab=rig
```
