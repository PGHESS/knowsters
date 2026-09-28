import './styles.css';
import { ENCOUNTER_PILOT_3D, ENCOUNTER_WORKSHOP, GUARDIAN_ORDER, boardDef } from '@knowsters/content';
import { createBattle, createCreature, seededRng, type BattleState } from '@knowsters/rules';
import { formatDiagnostic, validateManifest, type Diagnostic, type Manifest } from './assets/contract';
import { AssetRegistry } from './assets/registry';
import { Matrix, Vector3 } from './babylon';
import { Metrics } from './debug/metrics';
import { BattlePresenter } from './presenter/BattlePresenter';
import { FrameLoop, PRESETS, QualityGovernor, isPreset, type QualityPreset } from './quality';
import { createStage } from './scene/setup';
import { Hud } from './ui/hud';

/**
 * Knowsters 3D-Pilot (Babylon.js). Testfälle (Auftrag Phase F, Issue #3):
 *   ?case=1  1 Mensch + Pyro + 1 Gegner (Standard)
 *   ?case=2  1 Mensch + 4 Wesen + 3 Gegner
 *   ?case=3  wie 2, plus Auren auf allen Einheiten (VFX aktiv)
 *   ?quality=auto|high|balanced|fallback30   (Standard auto: startet bei high, stuft bei Bedarf ab)
 *   ?strict=1   Abnahmemodus: jede Diagnose ab Stufe warn (Platzhalter, fehlende Clips) stoppt den Start
 * Der Regelkern (@knowsters/rules) bleibt die einzige Wahrheit; Babylon ist Presenter.
 */
const params = new URLSearchParams(location.search);
const caseNo = Math.max(1, Math.min(3, Number(params.get('case') ?? 1)));
const qualityParam = params.get('quality');
const strict = params.get('strict') === '1';
const base = import.meta.env.BASE_URL;

function diag(reason: string, e?: unknown): void {
  const box = document.getElementById('diag') as HTMLElement;
  const detail = document.getElementById('diag-detail') as HTMLElement;
  const body = e instanceof Error ? `Fehler: ${e.message}\n${e.stack ?? ''}` : typeof e === 'string' ? e : '';
  detail.textContent = [`Grund: ${reason}`, body, `Build: ${__BUILD_ID__}`, `UA: ${navigator.userAgent}`, `WebGL: ${webgl()}`].join('\n');
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

/** Diagnosen sichtbar machen (Issue #3, Punkt 5): Fehler und Hinweise im Screen, Infos in der Konsole. */
function renderDiagnostics(registry: AssetRegistry): void {
  let panel = document.getElementById('diagnostics');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'diagnostics';
    document.body.appendChild(panel);
  }
  const lines: { level: Diagnostic['level']; text: string }[] = [];
  for (const d of registry.errors) lines.push({ level: 'error', text: `${d.asset}: ${d.message}` });
  for (const d of registry.warnings) lines.push({ level: 'warn', text: `${d.asset}: ${d.message}` });
  if (registry.placeholdersInUse.size) {
    const keys = [...registry.placeholdersInUse.keys()];
    lines.push({ level: 'warn', text: `Platzhalter aktiv (${keys.length}): ${keys.join(', ')} · Khronos Fox/CesiumMan CC-BY 4.0, siehe THIRD_PARTY_ASSETS.md · keine Zielgrafik` });
  }
  panel.innerHTML = '';
  for (const l of lines.slice(0, 6)) {
    const row = document.createElement('div');
    row.className = l.level;
    row.textContent = `${l.level === 'error' ? '✖' : '⚠'} ${l.text}`;
    panel.appendChild(row);
  }
  panel.hidden = lines.length === 0;
}

async function main(): Promise<void> {
  const canvas = document.getElementById('render') as HTMLCanvasElement;
  const state = buildState(caseNo);
  const board = boardDef(state.boardId);
  const initial: QualityPreset = isPreset(qualityParam) ? qualityParam : 'high';
  const auto = !isPreset(qualityParam);
  const stage = createStage(canvas, board.width, board.height, PRESETS[initial]);
  const loop = new FrameLoop(stage.engine, stage.scene, PRESETS[initial].targetFps);
  loop.start();

  let presenter: BattlePresenter | null = null;
  const hud = new Hud({
    onMove: () => presenter?.move(),
    onBasic: () => presenter?.basic(),
    onSkill: (id) => presenter?.skill(id),
    onWait: () => presenter?.wait(),
    onRally: () => presenter?.rally(),
    onCancel: () => presenter?.cancel(),
    onCase: (n) => { location.search = `?case=${n}${qualityParam ? `&quality=${qualityParam}` : ''}`; },
    onQuality: (q) => { location.search = `?case=${caseNo}&quality=${q}`; },
    onRetry: () => location.reload(),
  });
  const governor = new QualityGovernor(stage, loop, {
    initial,
    auto,
    onChange: (preset, reason) => {
      hud.quality = { preset, auto, reason };
      hud.rerender();
    },
  });
  hud.quality = { preset: governor.current, auto, reason: governor.reason };

  const manifest = (await (await fetch(`${base}assets/manifests/pilot.json`)).json()) as Manifest;
  const registry = new AssetRegistry(stage.scene, `${base}assets/`, manifest);
  for (const d of validateManifest(manifest)) registry.report(d);
  if (registry.errors.length) {
    diag('Manifest ungültig', registry.errors.map(formatDiagnostic).join('\n'));
    return;
  }

  presenter = new BattlePresenter(stage, hud, registry, caseNo === 3);
  await presenter.mount(state);
  renderDiagnostics(registry);
  governor.start();
  const metrics = new Metrics(stage.engine, stage.scene, `Fall ${caseNo}`, registry, governor, loop);
  metrics.loadBuildInfo(base);
  (window as unknown as { pilot: unknown }).pilot = {
    state,
    presenter,
    metrics,
    stage,
    registry,
    governor,
    loop,
    build: __BUILD_ID__,
    snapshot: () => metrics.snapshot(),
    diagnostics: () => registry.diagnostics.map(formatDiagnostic),
    setQuality: (q: QualityPreset) => governor.apply(q, 'per Konsole'),
    Vector3,
    Matrix,
  };
  console.info(`Knowsters 3D-Pilot ${__BUILD_ID__} · Babylon · Fall ${caseNo} · quality ${governor.current}${auto ? ' (auto)' : ''}`);
  if (strict && (registry.errors.length || registry.warnings.length || registry.placeholdersInUse.size)) {
    const list = [...registry.errors, ...registry.warnings].map(formatDiagnostic);
    if (registry.placeholdersInUse.size) list.push(`[warn] Platzhalter aktiv: ${[...registry.placeholdersInUse.entries()].map(([k, v]) => `${k}→${v}`).join(', ')}`);
    diag('Abnahme blockiert (strict): Produktionsassets fehlen oder verletzen den Vertrag', list.join('\n'));
  }
}

main().catch((e) => diag('Start fehlgeschlagen', e));
