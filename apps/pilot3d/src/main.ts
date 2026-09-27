import './styles.css';
import { Matrix, Vector3 } from '@babylonjs/core';
import { ENCOUNTER_PILOT_3D, ENCOUNTER_WORKSHOP, GUARDIAN_ORDER, boardDef } from '@knowsters/content';
import { createBattle, createCreature, seededRng, type BattleState } from '@knowsters/rules';
import { Metrics } from './debug/metrics';
import { BattlePresenter, type Manifest } from './presenter/BattlePresenter';
import { createStage } from './scene/setup';
import { Hud } from './ui/hud';

/**
 * Knowsters 3D-Pilot (Babylon.js). Testfälle (Auftrag Phase F):
 *   ?case=1  1 Mensch + Pyro + 1 Gegner (Standard)
 *   ?case=2  1 Mensch + 4 Wesen + 3 Gegner
 *   ?case=3  wie 2, plus Auren auf allen Einheiten (VFX aktiv)
 * Der Regelkern (@knowsters/rules) bleibt die einzige Wahrheit; Babylon ist Presenter.
 */
const params = new URLSearchParams(location.search);
const caseNo = Math.max(1, Math.min(3, Number(params.get('case') ?? 1)));
const base = import.meta.env.BASE_URL;

function diag(reason: string, e?: unknown): void {
  const box = document.getElementById('diag') as HTMLElement;
  const detail = document.getElementById('diag-detail') as HTMLElement;
  detail.textContent = [`Grund: ${reason}`, e instanceof Error ? `Fehler: ${e.message}\n${e.stack ?? ''}` : '', `Build: ${__BUILD_ID__}`, `UA: ${navigator.userAgent}`, `WebGL: ${webgl()}`].join('\n');
  box.hidden = false;
}
function webgl(): string {
  try {
    const c = document.createElement('canvas');
    return c.getContext('webgl2') ? 'webgl2' : c.getContext('webgl') ? 'webgl1' : 'nicht verfügbar';
  } catch (e) {
    return `Fehler ${(e as Error).message}`;
  }
}
window.addEventListener('error', (e) => diag('Unbehandelter Fehler', e.error));
window.addEventListener('unhandledrejection', (e) => diag('Unbehandelte Promise-Ablehnung', e.reason));

function buildState(n: number): BattleState {
  const rng = seededRng(42 + n);
  const encounter = n === 1 ? ENCOUNTER_PILOT_3D : ENCOUNTER_WORKSHOP;
  const team = GUARDIAN_ORDER.map((s) => createCreature(s, `${s}-1`, rng));
  const pyro = team.find((c) => c.speciesId === 'pyro');
  // Pilot: Signature-Skill Glutspur ist freigeschaltet, damit Skill-VFX und Gelände sichtbar werden.
  if (pyro && !pyro.unlocked.includes('pyro-trail')) pyro.unlocked.push('pyro-trail');
  return createBattle(encounter, team, { turnOrder: 'sides' });
}

async function main(): Promise<void> {
  const canvas = document.getElementById('render') as HTMLCanvasElement;
  const state = buildState(caseNo);
  const board = boardDef(state.boardId);
  const stage = createStage(canvas, board.width, board.height);
  const manifest = (await (await fetch(`${base}assets/manifests/pilot.json`)).json()) as Manifest;
  const note = document.createElement('div');
  note.className = 'placeholder-note';
  note.textContent = 'PLATZHALTER-MODELLE (Khronos Fox / CesiumMan, CC-BY 4.0, siehe THIRD_PARTY_ASSETS.md) · keine Zielgrafik';
  document.body.appendChild(note);

  let presenter: BattlePresenter | null = null;
  const hud = new Hud({
    onMove: () => presenter?.move(),
    onBasic: () => presenter?.basic(),
    onSkill: (id) => presenter?.skill(id),
    onWait: () => presenter?.wait(),
    onRally: () => presenter?.rally(),
    onCancel: () => presenter?.cancel(),
    onCase: (n) => { location.search = `?case=${n}`; },
    onRetry: () => location.reload(),
  });
  presenter = new BattlePresenter(stage, hud, manifest, `${base}assets/`, caseNo === 3);
  await presenter.mount(state);
  const metrics = new Metrics(stage.engine, stage.scene, `Fall ${caseNo}`);
  (window as unknown as { pilot: unknown }).pilot = { state, presenter, metrics, stage, build: __BUILD_ID__, snapshot: () => metrics.snapshot(), Vector3, Matrix };
  console.info(`Knowsters 3D-Pilot ${__BUILD_ID__} · Babylon · Fall ${caseNo}`);
}

main().catch((e) => diag('Start fehlgeschlagen', e));
