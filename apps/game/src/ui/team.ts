import { ABILITIES, ATTRIBUTE_DEFS, ATTRIBUTE_ORDER, CURRICULUM, SUBJECT_ORDER, guardianDef, type AttributeId } from '@knowsters/content';
import { attributeCost, checkUnlock, unlockAbility } from '@knowsters/rules';
import type { GameStore } from '../store/store';
import { esc, hideSheet, onAction, showSheet } from './overlay';

const topicLabel = (topicId: string): string => {
  for (const s of SUBJECT_ORDER) {
    const stage = CURRICULUM[s].find((st) => st.id === topicId);
    if (stage) return stage.title;
  }
  return topicId;
};

/** Team-Sheet: Wesen groß, Attribute als RPG-Werte, Fähigkeiten mit Voraussetzungen und Freischaltung. */
export function showTeam(store: GameStore, onClose: () => void, focus?: string): void {
  const team = store.team();
  const knowledge = store.state.player.knowledge;
  const cards = team
    .map((c) => {
      const species = guardianDef(c.speciesId);
      const total = ATTRIBUTE_ORDER.reduce((s, a) => s + c.attributes[a].potential, 0);
      const attrs = ATTRIBUTE_ORDER.map((a: AttributeId) => {
        const v = c.attributes[a];
        const need = attributeCost(v.value);
        const pct = v.value >= v.potential ? 100 : Math.min(100, (v.progress / need) * 100);
        return `<span title="${esc(ATTRIBUTE_DEFS[a].hint)}">${esc(ATTRIBUTE_DEFS[a].short)} <b>${v.value}</b><small>/${v.potential}</small></span><i style="background:linear-gradient(90deg,#5de5f1 ${pct.toFixed(0)}%,#173240 ${pct.toFixed(0)}%)"></i>`;
      }).join('');
      const skills = species.abilities
        .map((id) => {
          const a = ABILITIES[id]!;
          const known = c.unlocked.includes(id);
          if (known) return `<div class="skill-card"><b>${esc(a.icon)} ${esc(a.name)}</b> <small>· Reichweite ${a.range}${a.resonanceCost ? ` · ${a.resonanceCost} Resonanz` : ''}</small><br><small>${esc(a.desc)}</small></div>`;
          const check = checkUnlock(c, knowledge, a);
          const req = a.requirements ?? {};
          const lines: string[] = [];
          for (const [attr, need] of Object.entries(req.attributes ?? {})) {
            const have = c.attributes[attr as AttributeId].value;
            lines.push(`<li class="${have >= need ? 'ok' : ''}">${esc(ATTRIBUTE_DEFS[attr as AttributeId].label)} ${have}/${need} ${have >= need ? '✓' : ''}</li>`);
          }
          if (req.skillPoints) lines.push(`<li>${req.skillPoints} Fähigkeitspunkt (du hast ${c.skillPoints}) ${c.skillPoints >= req.skillPoints ? '✓' : ''}</li>`);
          if (req.knowledgeProof) lines.push(`<li>Wissensnachweis „${esc(topicLabel(req.knowledgeProof))}“ ${knowledge.proofs.includes(req.knowledgeProof) ? '✓' : '– über <b>Wissen</b> ablegen'}</li>`);
          return `<div class="skill-card locked"><b>${esc(a.icon)} ${esc(a.name)}</b> <small>· gesperrt</small><br><small>${esc(a.desc)}</small><ul>${lines.join('')}</ul>
            <div class="row"><button class="btn small ${check.ok ? 'primary' : ''}" data-action="unlock" data-creature="${esc(c.id)}" data-ability="${esc(id)}" ${check.ok ? '' : 'disabled'}>${check.ok ? 'Jetzt lernen' : 'Voraussetzungen fehlen'}</button></div></div>`;
        })
        .join('');
      return `<article class="creature-card" id="card-${esc(c.id)}">
        <img src="assets/creatures/${esc(species.sprite)}.png" alt="${esc(species.name)}" />
        <div>
          <h3>${esc(c.name)} <small>· ${esc(species.role)}</small></h3>
          <small>${esc(species.trait)} · Potenzial ${total.toLocaleString('de-DE')} / 8.000 · ✦ ${c.skillPoints} Punkte</small>
          <div class="attr-grid">${attrs}</div>
          ${skills}
        </div>
      </article>`;
    })
    .join('');
  const sheet = showSheet(
    `<div class="kicker">Team · ${team.length} von 4 Plätzen</div><h2>Deine Wesen</h2>
     <p>Wissen gehört dir. Entwicklung, Potenzial und Fähigkeiten gehören jedem Wesen einzeln.</p>
     <div class="creature-list">${cards}</div>
     <div class="row"><button class="btn primary" data-action="close">Schließen</button></div>`,
    { dismissible: true, onDismiss: onClose },
  );
  if (focus) sheet.querySelector(`#card-${CSS.escape(focus)}`)?.scrollIntoView({ block: 'start' });
  onAction(sheet, {
    close: () => {
      hideSheet();
      onClose();
    },
    unlock: (el) => {
      const c = store.creature(el.dataset.creature ?? null);
      const abilityId = el.dataset.ability ?? '';
      if (!c) return;
      let ok = false;
      store.update(() => {
        ok = unlockAbility(c, store.state.player.knowledge, abilityId).ok;
      });
      if (ok) showTeam(store, onClose, c.id);
    },
  });
}
