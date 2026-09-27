const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../v22/prolog.js'),'utf8'),ctx);
const P=ctx.window.KnowstersProlog;
assert.equal(P.guardians.length,4);
for(const g of P.guardians){assert.equal(g.abilities.length,4,g.id);assert.ok(g.role);assert.ok(g.trait);assert.ok(g.portrait);assert.ok(g.sprite);}
let b=P.freshBattle();
assert.equal(P.status(b).round,1);assert.equal(P.status(b).phase,'player');assert.equal(P.status(b).guardians.length,4);assert.equal(P.status(b).enemies.length,3);assert.equal(b.maxRounds,6);
// One action per guardian now opens a real sequential enemy phase instead of resolving every enemy at once.
assert.ok(P.setMode(b,'pyro-charge').ok);assert.ok(P.tile(b,4,2).ok);
assert.ok(P.wait(b,'lumi').ok);assert.ok(P.wait(b,'terra').ok);assert.ok(P.wait(b,'nivaro').ok);
assert.equal(b.round,1);assert.equal(b.phase,'enemy');const queued=b.enemyQueue.length;assert.ok(queued>=1);
const firstEnemyStep=P.nextEnemyAction(b);assert.ok(firstEnemyStep.ok);assert.equal(b.phase,'enemy');assert.ok(b.enemyQueue.length<queued);
P.resolveEnemyPhase(b);assert.equal(b.phase,'player');assert.equal(b.round,2);assert.ok(P.status(b).enemies.length>=4);
// Terra's wall creates a real blocker.
P.select(b,'terra');assert.ok(P.setMode(b,'terra-wall').ok);const valid=[...P.validTiles(b,'terra','terra-wall')][0];assert.ok(valid);const [x,y]=valid.split(':').map(Number);assert.ok(P.tile(b,x,y).ok);assert.ok(b.walls.some(w=>w.x===x&&w.y===y));
// A battle that reaches the end with fewer than three escapes is a prolog victory after the enemy phase resolves.
b=P.freshBattle();b.round=6;b.units=b.units.filter(u=>u.kind==='guardian');for(const g of P.guardians)assert.ok(P.wait(b,g.id).ok);assert.equal(b.phase,'enemy');P.resolveEnemyPhase(b);assert.equal(b.result,'won');
const html=P.battleMarkup(P.freshBattle());for(const token of ['prolog-board','Lumi','Pyro','Terra','Nivaro','data-action="prolog-tile"','unit-sprite','battle-pyro.webp'])assert.ok(html.includes(token),token);
// v19/v20 presentation events survive the rule action so the UI can render projectiles and floating values.
b=P.freshBattle();P.select(b,'lumi');assert.ok(P.setMode(b,'lumi-beam').ok);assert.ok(P.tile(b,6,1).ok);assert.ok(Array.isArray(b.fxEvents)&&b.fxEvents.some(e=>e.type==='beam'&&e.amount===3));const fxHtml=P.battleMarkup(b);assert.ok(fxHtml.includes('prolog-fx-layer'));assert.ok(fxHtml.includes('fx-path beam'));assert.ok(fxHtml.includes('prolog-floater damage'));
// Enemy-phase markup visibly locks the player controls and announces the phase.
b=P.freshBattle();b.phase='enemy';b.enemyQueue=b.units.filter(u=>u.kind==='enemy').map(u=>u.id);const enemyHtml=P.battleMarkup(b);assert.ok(enemyHtml.includes('enemy-phase'));assert.ok(enemyHtml.includes('Gegnerzug'));assert.ok(enemyHtml.includes('Das Rauschen handelt'));
console.log('PASS: four guardians, 16 abilities, creature sprites, sequential enemy phase, tactical bridge grid, visual event overlays and six-round victory condition.');
