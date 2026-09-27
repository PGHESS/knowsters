import { encounterDef } from '@knowsters/content';
import { esc, onAction, showSheet } from './overlay';

export interface ResultOptions {
  encounterId: string;
  result: 'won' | 'lost';
  rewardSkillPoints: number;
  round: number;
  onContinue: () => void;
  onRetry: () => void;
}

export function showResult(o: ResultOptions): void {
  const e = encounterDef(o.encounterId);
  const won = o.result === 'won';
  const sheet = showSheet(
    `<div class="kicker">${esc(e.title)} · Runde ${o.round}</div>
     <h2>${won ? 'Gehalten.' : 'Zurückgezogen.'}</h2>
     <p class="lead">${esc(won ? e.victory : e.defeat)}</p>
     ${won ? `<div class="chips"><span class="chip ok">+${o.rewardSkillPoints} Fähigkeitspunkt je Wesen</span></div>` : '<div class="chips"><span class="chip warn">Kein Verlust an Entwicklung. Versuch es anders.</span></div>'}
     <div class="row">
       ${won ? '' : '<button class="btn" data-action="retry">Nochmal</button>'}
       <button class="btn primary" data-action="continue">${won ? 'Weiter' : 'Zurück auf den Platz'}</button>
     </div>`,
    { center: true },
  );
  onAction(sheet, { continue: o.onContinue, retry: o.onRetry });
}
