import { esc, hideSheet, onAction, showSheet } from './overlay';

export interface DialogChoice {
  label: string;
  /** Rückgabe true = Dialog schließen. */
  onSelect: () => boolean | void;
  primary?: boolean;
}

export interface DialogStep {
  speaker: string;
  text: string;
  choices?: DialogChoice[];
}

/** Dialogbox unten, Welt bleibt sichtbar (Auftrag: Story/Dialog). Maximal 2–4 Optionen. */
export function showDialog(steps: DialogStep[], onClose?: () => void): void {
  let i = 0;
  const render = () => {
    const step = steps[i];
    if (!step) {
      hideSheet();
      onClose?.();
      return;
    }
    const last = i === steps.length - 1;
    const choices = step.choices?.length
      ? step.choices.map((c, idx) => `<button class="btn ${c.primary ? 'primary' : ''}" data-action="choice" data-index="${idx}">${esc(c.label)}</button>`).join('')
      : `<button class="btn primary" data-action="next">${last ? 'Weiter' : '…'}</button>`;
    const sheet = showSheet(`<div class="dialog"><div class="speaker">${esc(step.speaker)}</div><div class="line">${esc(step.text)}</div><div class="row" style="flex-direction:column">${choices}</div></div>`);
    onAction(sheet, {
      next: () => {
        i++;
        render();
      },
      choice: (el) => {
        const c = step.choices?.[Number(el.dataset.index)];
        if (!c) return;
        const close = c.onSelect();
        if (close !== false) {
          hideSheet();
          onClose?.();
        }
      },
    });
  };
  render();
}
