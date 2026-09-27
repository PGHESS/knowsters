# Bekannte Probleme und Einschränkungen

Stand: wird je Phase fortgeschrieben.

## Behoben in M0

- **Phaser-Spike zeigte auf jedem Gerät „Rendering konnte nicht gestartet werden“.** Ursache: `#load-error{display:flex}` (ID-Selektor) überschrieb die Browser-Regel `[hidden]{display:none}`. Phaser lief darunter normal. Fix in `legacy/v25-spike/phaser-spike.css`.
- **Alter v22-Service-Worker cached alle JS/CSS cache-first ohne Ablauf** (Scope `/knowsters/`). Spike-Seite meldet jetzt alle Registrierungen ab und löscht `knowsters-*`-Caches. Der v22-Prototyp liegt unter `/legacy/v22/`, sein Service Worker gilt nur noch dort.
- **Fallback ohne Diagnose.** Der Spike zeigt jetzt Exception, User Agent, Phaser-Version, WebGL-Verfügbarkeit und Viewport.
- **Kein Source of Truth im Repo.** v22-Quellen (minifiziert, aber lesbar), Spike und die alte Test-Suite liegen jetzt unter `legacy/`. Das ZIP ist entfernt (in der Git-Historie weiterhin vorhanden).

## Offen nach M0

- Der v22-Prototyp bleibt ein Browser-Layout und wird nicht weiterentwickelt.
- Der Spike enthält weiterhin seine eigenen Mini-Kampfregeln. Er ist Referenz für Look-and-Feel, nicht für Regeln.
- Handytest auf echtem iPhone nach dem Deploy: bitte im privaten Tab öffnen, damit weder HTTP-Cache noch eine noch registrierte alte Service-Worker-Instanz das Ergebnis verfälscht.
