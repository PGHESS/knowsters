# Knowsters – Safari-Test über GitHub Pages

Das Repository ist bereits für einen GitHub-Pages-Test vorbereitet.

## Einmalig in GitHub
1. Repository **PGHESS/knowsters** öffnen.
2. **Settings → Pages**.
3. Unter **Build and deployment** als Quelle **GitHub Actions** auswählen.

## Aktuelle Spielversion hochladen
Für den Test wird nur **eine Datei** benötigt:

`Knowsters-v22-WebDeploy.zip`

Diese ZIP enthält den kompletten Web-Build mit HTML, CSS, JavaScript, Bildern, Icons und Manifest.

### Upload
1. Im Repository **Add file → Upload files**.
2. `Knowsters-v22-WebDeploy.zip` auswählen.
3. Auf den Branch **main** committen.

Danach startet automatisch der Workflow **Deploy Knowsters to GitHub Pages**.

Der Workflow:
- entpackt die ZIP,
- übernimmt den enthaltenen Ordner `Knowsters-v22-WebDeploy`,
- erstellt daraus die statische Site,
- veröffentlicht sie über GitHub Pages.

## Erwartete Testadresse
Nach erfolgreichem Deployment liegt die Site typischerweise unter:

`https://pghess.github.io/knowsters/`

## Spätere Updates
Für einen neuen Teststand wird nur die ZIP im Repository ersetzt. Der Pages-Workflow veröffentlicht danach automatisch die neue Version.

---
Aktueller Teststand: **Knowsters v22**
