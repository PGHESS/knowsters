import type { GameStore } from '../store/store';
import { hideSheet, onAction, showSheet } from './overlay';

/** Platzhalter bis M4: Der Wissensscreen kommt mit dem Lern-Loop. */
export function showKnowledge(store: GameStore, onClose: () => void): void {
  const k = store.state.player.knowledge;
  const sheet = showSheet(
    `<div class="kicker">Wissen</div><h2>Wissensprofil</h2>
     <p>Mathematik · Stufe ${k.subjects.math.level + 1}/8 · Nachweise: ${k.proofs.length}</p>
     <p>Übung und Prüfung folgen in Phase M4.</p>
     <div class="row"><button class="btn primary" data-action="close">Schließen</button></div>`,
    { dismissible: true, onDismiss: onClose },
  );
  onAction(sheet, { close: () => { hideSheet(); onClose(); } });
}
