import { ABILITIES, basicAttackDef, guardianDef } from '@knowsters/content';
import { canAct, living, unitById, type BattleState } from '@knowsters/rules';
import { PRESETS, type QualityPreset } from '../quality';

export interface HudHandlers {
  onMove(): void;
  onBasic(): void;
  onSkill(id: string): void;
  onWait(): void;
  onRally(): void;
  onCancel(): void;
  onCase(n: number): void;
  onQuality(q: QualityPreset | 'auto'): void;
  onRetry(): void;
}

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** DOM-HUD über dem Babylon-Canvas: HUD oben, Aktionssatz unten (Bible §8), Ergebnis als Karte. */
export class Hud {
  private readonly root: HTMLElement;
  private skillsOpen = false;
  message = '';
  /** Aktuelles Quality-Preset (Anzeige der Chips). */
  quality: { preset: QualityPreset; auto: boolean; reason: string } = { preset: 'high', auto: true, reason: '' };

  constructor(private readonly h: HudHandlers) {
    this.root = document.getElementById('hud') as HTMLElement;
    this.root.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
      if (!el || el.hasAttribute('disabled')) return;
      const a = el.dataset.action;
      if (a === 'move') h.onMove();
      else if (a === 'basic') h.onBasic();
      else if (a === 'skills') { this.skillsOpen = true; this.rerender(); }
      else if (a === 'close-skills') { this.skillsOpen = false; h.onCancel(); }
      else if (a === 'skill') h.onSkill(el.dataset.id ?? '');
      else if (a === 'wait') h.onWait();
      else if (a === 'rally') h.onRally();
      else if (a === 'case') h.onCase(Number(el.dataset.n));
      else if (a === 'quality') h.onQuality((el.dataset.q ?? 'auto') as QualityPreset | 'auto');
      else if (a === 'retry') h.onRetry();
    });
  }

  private last: { state: BattleState; busy: boolean; note: string } | null = null;

  rerender(): void {
    if (this.last) this.render(this.last.state, this.last.busy, this.last.note);
  }

  closeSkills(): void {
    this.skillsOpen = false;
  }

  render(state: BattleState, busy: boolean, note: string): void {
    this.last = { state, busy, note };
    const s = state;
    const sel = unitById(s, s.selected);
    const active = !busy && !s.result && s.phase === 'player' && canAct(s, s.selected);
    const objective = s.result ? (s.result === 'won' ? 'GEWONNEN' : 'VERLOREN') : `GEGNER ${living(s, 'enemy').length}`;
    let actions = '';
    if (this.skillsOpen && sel) {
      const species = guardianDef(sel.speciesId);
      actions = `<div class="actions skills">${species.abilities
        .map((id, i) => {
          const a = ABILITIES[id]!;
          const known = sel.abilities.includes(id);
          const ok = known && sel.resonance >= a.resonanceCost && active;
          return `<button class="btn ${i === 3 ? 'sig' : ''} ${s.mode === id ? 'active' : ''}" data-action="skill" data-id="${id}" ${ok ? '' : 'disabled'}>${esc(a.icon)} ${esc(a.name)}<small>${known ? `R ${a.range}${a.resonanceCost ? ` · ${a.resonanceCost} RES` : ''}` : 'gesperrt'}</small></button>`;
        })
        .join('')}<button class="btn ghost" data-action="close-skills">‹<small>zurück</small></button></div>`;
    } else {
      const basic = sel?.basicAttack ? basicAttackDef(sel.basicAttack) : null;
      actions = `<div class="actions">
        <button class="btn ${s.mode === 'move' ? 'active' : ''}" data-action="move" ${active ? '' : 'disabled'}>↔ BEWEGEN<small>${sel ? sel.move + s.teamMoveBonus : 0} Felder</small></button>
        <button class="btn attack ${s.mode === 'basic' ? 'active' : ''}" data-action="basic" ${active && basic ? '' : 'disabled'}>⚔ ${esc(basic?.name ?? 'ANGRIFF')}<small>Grundangriff · R ${basic?.range ?? '–'}</small></button>
        <button class="btn skills" data-action="skills" ${active ? '' : 'disabled'}>✦ FÄHIGK.<small>4 Slots</small></button>
        <button class="btn wait" data-action="wait" ${active ? '' : 'disabled'}>WARTEN<small>Zug beenden</small></button>
      </div>`;
    }
    const info = note || (s.result ? '' : s.phase === 'enemy' ? 'Das Rauschen handelt …' : s.mode === 'move' ? 'Tippe ein leuchtendes Feld.' : s.mode === 'basic' ? 'Tippe einen markierten Gegner.' : s.mode ? 'Tippe ein Ziel.' : 'Bewegen, Grundangriff, Fähigkeit oder Warten.');
    this.root.innerHTML = `
      <div>
        <div class="top">
          <span class="pill">RUNDE ${s.round}</span>
          <span class="pill">${s.phase === 'enemy' ? 'GEGNER' : 'DEIN ZUG'}</span>
          <span class="pill warn">${objective}</span>
          <button class="btn command" data-action="rally" ${!busy && !s.result && s.phase === 'player' && !s.rallyUsed ? '' : 'disabled'} style="min-height:38px;padding:4px 10px">⚑ SAMMELN<small>Beschwörer</small></button>
        </div>
        <div class="msg">${esc(this.message || s.message)}</div>
        <div class="cases"><button class="chip" data-action="case" data-n="1">Fall 1</button><button class="chip" data-action="case" data-n="2">Fall 2</button><button class="chip" data-action="case" data-n="3">Fall 3 · VFX</button></div>
        <div class="cases">${(['auto', 'high', 'balanced', 'fallback30'] as const).map((q) => `<button class="chip ${q === 'auto' ? (this.quality.auto ? 'on' : '') : !this.quality.auto && this.quality.preset === q ? 'on' : ''}" data-action="quality" data-q="${q}">${q === 'auto' ? `Auto${this.quality.auto ? ` · ${PRESETS[this.quality.preset].label}` : ''}` : PRESETS[q].label}</button>`).join('')}</div>
      </div>
      <div class="bottom">
        <div class="unit"><b>${esc(sel?.name?.toUpperCase() ?? '')}</b><span>${sel ? `${sel.hp}/${sel.maxHp} LP · Resonanz ${sel.resonance}/${sel.maxResonance}${sel.shield ? ` · Schild ${sel.shield}` : ''}` : ''}</span></div>
        <div class="info">${esc(info)}</div>
        ${actions}
      </div>`;
    if (s.result) {
      const card = document.createElement('div');
      card.className = 'result';
      card.innerHTML = `<h2>${s.result === 'won' ? 'Pilot bestanden.' : 'Verloren.'}</h2><p>${esc(s.message)}</p><div class="row"><button class="btn" data-action="retry">Nochmal</button><button class="btn ghost" data-action="case" data-n="2">Fall 2 laden</button></div>`;
      this.root.appendChild(card);
    }
  }
}
