# Legacy-Referenzstände

Dieser Ordner bewahrt die bisherigen Prototypen **unverändert lesbar** im Repo auf. Sie sind Referenz, nicht Entwicklungsbasis.

| Ordner | Inhalt | Status |
|---|---|---|
| `v22/` | HTML/CSS/JS-Prototyp v22 (ehemals `Knowsters-v22-WebDeploy-small.zip`), inkl. `progression.js`, `prolog.js`, `game.js`, Assets, Service Worker | eingefroren, spielbar unter `/legacy/v22/` |
| `v25-spike/` | Phaser-4.2.1-Rendering-Spike (Menu/World/Battle) | eingefroren, spielbar unter `/legacy/v25-spike/phaser-spike.html` |
| `tests-v20/` | die bestehende Test-Suite (Node `assert`), auf den v22-Build gerichtet | läuft mit `npm run test:legacy` |

## Änderungen gegenüber dem Originalstand (M0)

Nur das Nötigste, damit die Referenz auf Geräten überhaupt sichtbar ist:

1. `v25-spike/phaser-spike.css`: `#load-error[hidden]{display:none}` ergänzt. Vorher überschrieb `#load-error{display:flex}` das `hidden`-Attribut, und das Fehler-Overlay lag auf jedem Gerät über dem laufenden Spiel.
2. `v25-spike/phaser-spike.html`: Inline-Skript meldet alte Service Worker ab und löscht `knowsters-*`-Caches; Query-Versionen auf `v=26` erhöht; Asset-Pfade zeigen auf `../v22/assets/`.
3. `v25-spike/ks25-boot.js`: Fallback zeigt jetzt echte Diagnose (Exception, User Agent, Phaser-Version, WebGL-Verfügbarkeit, Viewport) statt „Verbindung prüfen“.
4. `tests-v20/*.cjs`: Pfade von `../dist` auf `../v22`, `schemaVersion` 20 → 22, `battle-pyro.png` → `.webp`. Keine inhaltlichen Änderungen.

`v22/` selbst ist byteidentisch mit dem ZIP-Inhalt. Sein Service Worker registriert sich mit Scope `./`, also nur unterhalb von `/legacy/v22/`.

## Warum die Spike-Regeln nicht weiterverwendet werden

`v25-spike/ks25-battle.js` enthält eigene Kampfregeln (LP, Schaden, Gegnerbewegung), die nichts mit `v22/prolog.js` zu tun haben. Der neue Stand in `packages/rules` portiert den getesteten Prolog-Regelkern; die Phaser-Szenen in `apps/game` stellen ihn nur dar.
