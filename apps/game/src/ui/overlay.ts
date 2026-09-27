/**
 * DOM-Overlays über dem Canvas: ein `#ui`-Container, genau ein aktives Sheet.
 * Textlastige Screens (Lernen, Team, Dialog, Ergebnis) leben hier; die Spielwelt bleibt in Phaser.
 */
const root = (): HTMLElement => {
  const el = document.getElementById('ui');
  if (!el) throw new Error('#ui fehlt');
  return el;
};

export interface SheetOptions {
  center?: boolean;
  /** Schließen durch Tippen auf den Hintergrund erlauben. */
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const esc = (v: unknown): string => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

let dismissHandler: ((e: Event) => void) | null = null;
let inputGate: ((open: boolean) => void) | null = null;

/** Wird von main.ts gesetzt: Phaser-Input sperren, solange ein Sheet offen ist (sonst sickern
 *  Pointer-Up-Events des Overlays über die Window-Events auf Canvas-Buttons durch). */
export function setInputGate(fn: (open: boolean) => void): void {
  inputGate = fn;
}

export function showSheet(html: string, opts: SheetOptions = {}): HTMLElement {
  const ui = root();
  ui.innerHTML = `<section class="sheet ${opts.center ? 'center' : ''}" role="dialog" aria-modal="true">${html}</section>`;
  ui.hidden = false;
  inputGate?.(true);
  if (dismissHandler) ui.removeEventListener('pointerdown', dismissHandler);
  dismissHandler = (e: Event) => {
    if (e.target === ui && opts.dismissible) {
      hideSheet();
      opts.onDismiss?.();
    }
  };
  ui.addEventListener('pointerdown', dismissHandler);
  return ui.querySelector('.sheet') as HTMLElement;
}

export function hideSheet(): void {
  const ui = root();
  ui.hidden = true;
  ui.innerHTML = '';
  inputGate?.(false);
}

export const isSheetOpen = (): boolean => !root().hidden;

/** Delegierte Klick-Handler per `data-action`. */
export function onAction(sheet: HTMLElement, handlers: Record<string, (el: HTMLElement) => void>): void {
  sheet.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target || target.hasAttribute('disabled')) return;
    const fn = handlers[target.dataset.action ?? ''];
    if (fn) fn(target);
  });
}
