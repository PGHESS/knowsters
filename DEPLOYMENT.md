# Build, CI und Gerätetest

## Lokal

```bash
npm ci
npm run dev        # Vite Dev-Server mit HMR: http://localhost:5173/knowsters/
npm run verify     # typecheck → vitest → Legacy-Tests → Build
npm run preview    # gebauten Stand unter http://localhost:4173/knowsters/ prüfen
```

Basis-Pfad ist `/knowsters/` (GitHub Pages). Für eine andere Basis: `KNOWSTERS_BASE=/ npm run build`.

## GitHub Actions (`.github/workflows/pages.yml`)

```
install → typecheck → tests (vitest) → Legacy-Tests → build → Site zusammenstellen → Pages deploy
```

- Läuft bei Push auf `main` und `claude/**` sowie bei Pull Requests (ohne Deploy).
- Die Site enthält die App unter `/` und die Referenzstände unter `/legacy/v22/` und `/legacy/v25-spike/` (Phaser für den Spike kommt aus `node_modules`, gepinnt 4.2.1).
- Vite erzeugt gehashte Dateinamen; es gibt keinen Service Worker. Der Browser-Cache kann daher keine veralteten Dateien mehr festhalten.

## Handytest (iPhone / Android)

1. Nach dem Deploy die URL im **privaten Tab** öffnen (umgeht einen noch registrierten alten Service Worker; die App entfernt ihn ohnehin beim ersten Start).
2. `https://pghess.github.io/knowsters/?fps=1` zeigt Bildrate, Renderer und Pixelratio oben links.
3. Erscheint ein Fehler-Overlay, Screenshot machen: Es enthält Exception, Build-ID, Phaser-Version, Renderer, WebGL-Verfügbarkeit und User Agent.
4. Für „Zum Home-Bildschirm“ (Standalone) ist die Seite vorbereitet (`apple-mobile-web-app-capable`, Safe Areas über `env()`).

## Capacitor (nach Abnahme, noch nicht eingerichtet)

```bash
npm i -w apps/game @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
KNOWSTERS_BASE=/ npm run build
npx cap init Knowsters de.knowsters.app --web-dir apps/game/dist
npx cap add ios && npx cap add android
npx cap sync && npx cap open ios
```

Zu beachten: `base` auf `/` setzen, Assets relativ; Speicherung läuft über das `SaveAdapter`-Interface und kann auf Capacitor Preferences umgestellt werden, ohne Spiellogik zu ändern.
