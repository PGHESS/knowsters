const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const read=name=>fs.readFileSync(root+'/v22/'+name,'utf8');
function setup(initial={},realEffects=false){
 let saved=JSON.stringify(initial),now=Date.UTC(2026,8,24,12),steps=[],draws=0,rafTime=0,worldInstance=null,serial=0;const frames=new Map();
 class Node{
  constructor(selector=''){this.selector=selector;this.nodes=new Map();this.events={};this.dataset={};this.style={};this.classList={add(){},toggle(){},remove(){}};this.innerHTML='';this.textContent='';}
  querySelector(selector){if(!this.nodes.has(selector))this.nodes.set(selector,new Node(selector));return this.nodes.get(selector);}
  querySelectorAll(selector){if(selector==='.move')return ['strike','guard','focus','ability'].map(a=>{const n=this.querySelector(a);n.dataset.action=a;return n});return [0,1,2,3].map(i=>this.querySelector(selector+i));}
  addEventListener(type,fn){this.events[type]=fn;}removeEventListener(type){delete this.events[type];}
  appendChild(){}remove(){}
  getBoundingClientRect(){return this.selector.includes('opponent')?{left:220,top:120,width:140,height:140}:{left:0,top:0,width:390,height:450};}
  getContext(){return new Proxy({},{get:(obj,key)=>obj[key]||(obj[key]=()=>{draws++})});}
  animate(){return{finished:Promise.resolve()};}
 }
 const app=new Node('app'),tools={};
 class Clock extends Date{static now(){return now;}}
 class FX{
  constructor(){this.actors={player:new Node(),opponent:new Node()};}
  actor(side){return this.actors[side];}callout(text){steps.push(text);}wait(){return Promise.resolve();}
  async action(side,kind,label,callback){steps.push({side,kind,label});await Promise.resolve();await callback();}
  async number(){}async hit(){}async particles(){}
 }
 const context={console,Date:Clock,Math:Object.assign(Object.create(Math),{random:()=>.25}),localStorage:{getItem:()=>saved,setItem:(k,v)=>{saved=v}},document:{getElementById:()=>app,modelContext:{registerTool:t=>{tools[t.name]=t}},createElement:()=>new Node()},KnowstersFX:FX,setTimeout:fn=>{queueMicrotask(fn);return 1},requestAnimationFrame:fn=>{if(realEffects){rafTime+=80;queueMicrotask(()=>fn(rafTime));return ++serial;}frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id),window:{matchMedia:()=>({matches:false}),devicePixelRatio:1,addEventListener(){},removeEventListener(){}}};
 vm.createContext(context);vm.runInContext(read('progression.js'),context);vm.runInContext(read('story.js'),context);vm.runInContext(read('narrative.js'),context);vm.runInContext(read('terrain.js'),context);vm.runInContext(read('avatar.js'),context);vm.runInContext(read('wardrobe.js'),context);vm.runInContext(read('avatar-editor.js'),context);vm.runInContext(read('world.js'),context);
 const W=context.window.KnowstersWorld;
 context.KnowstersWorld={...W,World:class extends W.World{constructor(...args){super(...args);worldInstance=this;}}};
 if(realEffects){vm.runInContext(read('battle-fx.js'),context);context.KnowstersFX=context.window.KnowstersFX;}
 vm.runInContext(read('comics.js'),context);vm.runInContext(read('skills-ui.js'),context);vm.runInContext(read('enemies.js'),context);vm.runInContext(read('prolog.js'),context);vm.runInContext(read('game.js'),context);
 return {app,steps,tools,P:context.window.KnowstersProgress,S:context.window.KnowstersStory,E:context.window.KnowstersEnemies,T:context.window.KnowstersTerrain,W,state:()=>JSON.parse(saved),draws:()=>draws,world:()=>worldInstance,advance:ms=>{now+=ms},click:(action,data={})=>app.events.click({target:{closest:()=>({disabled:false,dataset:{action,...data}})}}),move:(action,abilityId)=>tools.play_battle_turn.execute({move:action,abilityId}),pump:(n=500)=>{for(let i=0;i<n;i++){const copy=[...frames.values()];frames.clear();rafTime+=40;copy.forEach(fn=>fn(rafTime));}}};
}
const base=(chosen='ember')=>({schemaVersion:16,stage:'pet',prolog:{completed:true,battle:null},chosen,points:80,xp:0,wins:0,losses:0,skills:{math:0,logic:0,language:0},care:{},story:{nextEncounter:1000000,seenComics:{1:true,2:true,3:true,4:true,5:true}}});
const answer=g=>{const t=g.state().task;g.click('answer',{index:t.options.indexOf(t.answer)});};
(async()=>{
 let g=setup({story:{nextEncounter:1000000}});assert.equal(g.state().stage,'prolog-intro');assert.ok(g.app.innerHTML.includes('Die letzte Brücke'));g.click('prolog-start');assert.equal(g.state().stage,'prolog-battle');assert.equal(g.state().prolog.battle.units.filter(x=>x.kind==='guardian').length,4);assert.ok(g.app.innerHTML.includes('Runde 1/6'));
 g=setup({schemaVersion:15,stage:'prolog-after',prolog:{completed:false,battle:null},story:{nextEncounter:1000000}});g.click('prolog-continue');assert.equal(g.state().stage,'avatar');assert.equal(g.state().prolog.completed,true);assert.ok(g.app.innerHTML.includes('avatar-editor-shell'));g.click('avatar-select',{field:'hair',value:5});g.click('avatar-select',{field:'hairColor',value:8});g.click('avatar-select',{field:'face',value:7});g.click('avatar-select',{field:'top',value:4});g.click('age-band',{id:'16-17'});g.click('avatar-confirm');assert.equal(g.state().stage,'choose');assert.deepEqual(g.state().player.avatar,{face:7,hair:5,hairColor:8,top:0,pants:0});assert.equal(g.state().player.avatarCreated,true);await g.tools.choose_starter.execute({id:'ember'});assert.equal(g.state().stage,'battle');assert.deepEqual(g.state().pets.ember.unlocked,[]);assert.equal(g.state().schemaVersion,22);assert.deepEqual(g.state().player.avatar,{face:7,hair:5,hairColor:8,top:0,pants:0});assert.equal(g.state().player.activeCompanion,'ember');
 const first=g.move('strike');await assert.rejects(()=>g.move('strike'),/nicht verfügbar/);await first;assert.equal(g.state().battle.turn,2);assert.equal(g.steps.filter(x=>x.side==='player').length,1);
 while(g.state().stage==='battle')await g.move('strike');assert.equal(g.state().points,4);assert.equal(g.state().wins,1);g.click('praise');assert.equal(g.state().care.ember.bond,3);g.click('praise');assert.equal(g.state().care.ember.bond,3);
 g.click('world');assert.equal(g.state().stage,'world');assert.equal(g.state().world.zone,'village');assert.ok(g.app.innerHTML.includes('data-zone="village"'));g=setup({...g.state(),story:{...g.state().story,nextEncounter:1000000}});assert.ok(g.world().container.innerHTML.includes('world-companion'));assert.ok(g.world().container.innerHTML.includes('human-avatar-sprite'));
 // Real path routing and world animation: reach each location, both zones, and return.
 for(const map of Object.values(g.W.maps)){for(const place of map.places){const route=g.W.route(map,map.spawn,[place.x,place.y]);assert.ok(route.length>=2);for(let i=1;i<route.length;i++)assert.ok(g.T.clear(map,route[i-1],route[i]));assert.deepEqual([...route.at(-1)],[place.x,place.y]);}}

 let w=g.world();const math=w.map.places.find(x=>x.id==='math');w.go([math.x,math.y],math);g.pump();assert.equal(g.state().stage,'task');assert.ok(w.dead);assert.equal(g.state().trainingKind,'math');
 g.click('world');w=g.world();w.go([94,65],w.map.places.find(x=>x.id==='forest'));g.pump();assert.equal(g.state().world.zone,'forest');if(g.state().stage==='interlude')g.click('comic-continue');w=g.world();w.go([79,27],w.map.places.find(x=>x.id==='encounter'));g.pump();assert.equal(g.state().stage,'encounter');g.click('world');w=g.world();w.go([2,60],w.map.places.find(x=>x.id==='village'));g.pump();assert.equal(g.state().world.zone,'village');
 // v17 knowledge center: ten subjects, age-based starting estimate, locked wrong answers and +2 attribute development.
 g=setup(base());g.click('knowledge');assert.equal(g.state().stage,'knowledge');assert.equal(Object.keys(g.state().knowledge.domains).length,10);assert.ok(g.app.innerHTML.includes('IT, KI &amp; Social Media')||g.app.innerHTML.includes('IT, KI & Social Media'));g.click('age-band',{id:'25-40'});assert.equal(g.state().player.ageBand,'25-40');g.click('knowledge-start',{kind:'media'});assert.equal(g.state().stage,'task');g.click('begin-task',{kind:'media'});let kt=g.state().task;assert.equal(kt.kind,'media');const target=kt.attributeId,beforeAttr=g.state().pets.ember.attributes[target];g.click('answer',{index:kt.options.findIndex(x=>x!==kt.answer)});assert.equal(g.state().task.status,'wrong');assert.ok(g.app.innerHTML.includes('muted-answer'));assert.ok(g.app.innerHTML.includes('Ähnliche Aufgabe'));g.click('similar-task');kt=g.state().task;answer(g);assert.equal(g.state().knowledge.domains.media.correct,1);const afterAttr=g.state().pets.ember.attributes[target];assert.ok(afterAttr.value>beforeAttr.value||afterAttr.progress>beforeAttr.progress);assert.equal(g.state().task.attributeAward.development,2);
 // Affection time limit survives reload.
 g=setup(base());g.click('cuddle');assert.equal(g.state().care.ember.bond,1);g=setup(g.state());g.click('cuddle');assert.equal(g.state().care.ember.bond,1);g.advance(6*3600000-1);g.click('cuddle');assert.equal(g.state().care.ember.bond,1);g.advance(1);g.click('cuddle');assert.equal(g.state().care.ember.bond,2);
 // A completed task cannot award twice; each fifth success gives exactly one spendable point.
 g=setup(base('tide'));g.click('pick-task');for(let i=0;i<5;i++){g.click(i?'next-task':'begin-task',{kind:'math'});answer(g);const xp=g.state().xp;answer(g);assert.equal(g.state().xp,xp);}assert.equal(g.state().pets.tide.skillPoints,1);assert.equal(g.state().pets.tide.solved.math,5);assert.equal(g.P.track('math',g.state().pets.tide.mastery.math).tier,2);g.click('praise');assert.equal(g.state().care.tide.bond,3);g.click('skills');g.click('unlock',{id:'tide-wave'});assert.equal(g.state().pets.tide.skillPoints,0);g.click('unlock',{id:'tide-wave'});assert.equal(g.state().pets.tide.unlocked.filter(x=>x==='tide-wave').length,1);g=setup(g.state());assert.equal(g.state().pets.tide.skillPoints,0);
 // A wrong answer is locked, explained and followed by a fresh similar task. It cannot be converted into a correct answer by clicking again.
 g=setup(base());g.click('pick-task');g.click('begin-task',{kind:'logic'});const task=g.state().task,wrong=task.options.findIndex(x=>x!==task.answer);g.click('answer',{index:wrong});let failed=g.state();assert.equal(failed.task.status,'wrong');assert.equal(failed.knowledge.domains.logic.wrong,1);assert.equal(failed.xp,0);answer(g);assert.equal(g.state().xp,0);g=setup(g.state());assert.equal(g.state().points,79);g.click('similar-task');assert.equal(g.state().points,79);assert.notEqual(g.state().task.prompt,task.prompt);answer(g);assert.equal(g.state().xp,4);assert.equal(g.state().knowledge.domains.logic.correct,1);assert.equal(g.state().pets.ember.mastery.logic,1);assert.equal(g.state().pets.ember.mastery.math,0);
 // v13 wardrobe migration: previously claimed welcome reward receives the Layer Hoodie once.
 g=setup({...base(),player:{name:'Du',avatar:{face:2,hair:0,hairColor:1,top:0,pants:0},avatarCreated:true,wardrobe:{tops:[0],pants:[0]},activeCompanion:'ember'},story:{claimed:{welcome:true},nextEncounter:1000000,seenComics:{1:true}}});assert.ok(g.state().player.wardrobe.tops.includes(1));g=setup(g.state());assert.equal(g.state().player.wardrobe.tops.filter(x=>x===1).length,1);
 // Legacy progress: all old solved tasks count, the old ability and bond remain, and migration is idempotent.
 g=setup({...base('moss'),stage:'hub',xp:40,skills:{math:7,logic:2,language:1},bond:15});assert.equal(g.state().stage,'world');assert.equal(g.state().pets.moss.skillPoints,2);assert.ok(g.state().pets.moss.unlocked.includes('moss-shield'));g.click('pet-view');g.click('cuddle');assert.equal(g.state().care.moss.bond,16);g=setup(g.state());assert.equal(g.state().pets.moss.skillPoints,2);
 // Independent pet records and dependencies prevent cross-element purchases.
 const one=g.P.createPet(),two=g.P.createPet();for(let i=0;i<10;i++)g.P.award(one,'math');assert.equal(two.total,0);assert.equal(two.skillPoints,0);assert.equal(g.P.unlock(one,'moss','ember-wall'),false);assert.equal(g.P.unlock(one,'moss','moss-poison'),false);assert.equal(g.P.unlock(one,'moss','moss-vines'),true);
 // Every ability resolves through the actual effects engine, including ongoing effects and summons.
 for(const id of ['moss','ember','tide'])for(const ability of g.P.abilities[id]){
  const profile=g.P.createPet();profile.unlocked=g.P.abilities[id].map(a=>a.id);profile.sets=[['strike','guard','focus',ability.id]];profile.activeSet=0;
  const battle={first:false,won:false,award:0,hp:80,maxHp:100,enemy:300,maxEnemy:300,focus:4,shield:0,turn:1,blocked:0,summon:null,dot:null,weaken:0,reflect:0,log:'Test',settled:false};
  const test=setup({...base(id),pets:{[id]:profile},stage:'battle',battle},true);
  await test.move('ability',ability.id);assert.equal(test.state().battle.turn,2,ability.id);assert.ok(test.draws()>100);assert.equal(test.state().battle.focus,4-ability.focus);
  if(ability.type==='summon'){assert.equal(test.state().battle.summon.turns,2);await test.move('guard');await test.move('guard');assert.equal(test.state().battle.summon,null);}
  if(ability.type==='dot'){assert.equal(test.state().battle.dot.turns,2);await test.move('guard');await test.move('guard');assert.equal(test.state().battle.dot,null);}
  if(ability.type==='weaken')assert.equal(test.state().battle.weaken,1);
 }
 // A reload during an action returns to the last completed turn.
 g=setup(base());g.click('new-battle');const turn=g.move('strike');const interrupted=g.state();assert.ok(interrupted.battle.pending);const restored=setup(interrupted);assert.equal(restored.state().battle.turn,1);assert.equal(restored.state().battle.enemy,35);await turn;
 g.click('retreat');assert.equal(g.state().stage,'world');assert.equal(g.state().points,80);
 // Loss awards only once.
 g=setup(base());g.click('new-battle');while(g.state().stage==='battle')await g.move('focus');assert.equal(g.state().losses,1);assert.equal(g.state().points,82);g=setup(g.state());assert.equal(g.state().points,82);
 // Every chapter: decline, return, gift once, peaceful resolution and gated progression.
 g=setup({...base(),stage:'world',world:{zone:'forest',positions:{}}});
 for(let id=1;id<=5;id++){
  const chapter=g.S.chapters[id-1];assert.equal(g.state().world.zone,chapter.zone);
  g.click('chapter-gate');assert.equal(g.state().story.chapter,id);
  g.world().o.onEnter('encounter');g.click('peaceful');assert.equal(g.state().stage,'encounter');
  g.click('world');g.world().o.onEnter('resident');const before=g.state().points;
  if(id<5){g.click('resident-choice',{index:2});assert.equal(g.state().points,before);g.click('resident-retry');}
  g.click('resident-choice',{index:0});assert.equal(g.state().points,before+chapter.giftPoints);
  g.click('resident-retry');g.click('resident-choice',{index:1});assert.equal(g.state().points,before+chapter.giftPoints);
  g.click('world');g.world().o.onEnter('encounter');g.click('peaceful');assert.equal(g.state().story.resolved[id],'peaceful');
  const awarded=g.state().points;g.click('peaceful');assert.equal(g.state().points,awarded);
  g=setup(g.state());g.click('chapter-gate');assert.equal(g.state().story.chapter,Math.min(5,id+1));
 }
 assert.equal(g.state().stage,'ending');assert.equal(g.state().story.endingSeen,true);assert.equal(g.state().story.gifts.length,5);
 g.click('return-village');assert.equal(g.state().world.zone,'village');
 // Teachers are inhabitants; unfinished questions remain separate across houses and reloads.
 for(const [kind,name] of [['math','Professor Alwin'],['language','Mira'],['logic','Tara']]){
  g.world().o.onEnter(kind);assert.ok(g.app.innerHTML.includes(name));g.click('begin-task',{kind});assert.equal(g.state().task.kind,kind);g.click('world');
 }
 g=setup(g.state());g.world().o.onEnter('math');assert.equal(g.state().task.kind,'math');assert.ok(!g.state().task.complete);
 // Welcome and traveler gifts cannot be collected repeatedly.
 g.click('world');g.world().o.onEnter('guide');let prior=g.state().points;g.click('guide-gift');assert.ok(g.state().player.wardrobe.tops.includes(1));assert.ok(g.app.innerHTML.includes('Neue Kleidung'));g.click('guide-gift');assert.equal(g.state().points,prior+3);assert.equal(g.state().player.wardrobe.tops.filter(x=>x===1).length,1);g.click('world');g.click('wardrobe-open');assert.equal(g.state().stage,'wardrobe');assert.ok(g.app.innerHTML.includes('Charakter & Garderobe'));g.click('avatar-select',{field:'top',value:1});g.click('wardrobe-save');assert.equal(g.state().player.avatar.top,1);assert.equal(g.state().stage,'world');
 g=setup({...g.state(),stage:'dialog',dialog:{type:'traveler',chapter:1,step:'ask'}});prior=g.state().points;g.click('traveler-choice',{index:0});g=setup({...g.state(),dialog:{type:'traveler',chapter:1,step:'ask'}});g.click('traveler-choice',{index:1});assert.equal(g.state().points,prior+2);
 // Encounter pacing depends on movement, excludes the village, and waits near residents.
 for(const [roll,event] of [[.1,'attack'],[.7,'traveler'],[.95,'discovery']]){
  const story=g.S.create();story.nextEncounter=1;assert.equal(g.S.travel(story,'village',5,false,()=>roll),null);assert.equal(story.travel,0);
  assert.equal(g.S.travel(story,'forest',0,false,()=>roll),null);assert.equal(g.S.travel(story,'forest',2,true,()=>roll),null);
  assert.equal(g.S.travel(story,'forest',1,false,()=>roll),event);assert.equal(story.travel,0);assert.ok(story.nextEncounter>=110);
 }
 g=setup({...base(),stage:'world',world:{zone:'forest',positions:{}},story:{nextEncounter:1}});g.pump(20);assert.equal(g.state().stage,'world');g.world().o.onTravel(2,[40,50]);assert.equal(g.state().battle.kind,'random');assert.equal(g.state().battle.zone,'forest');g.click('retreat');assert.equal(g.state().world.zone,'forest');assert.ok(g.state().story.nextEncounter>=110);
 // A boss victory resolves its chapter; random battles do not.
 g=setup({...base(),stage:'world',world:{zone:'forest',positions:{}}});g.world().o.onEnter('encounter');g.click('new-battle');while(g.state().stage==='battle')await g.move('strike');assert.equal(g.state().story.resolved[1],'battle');assert.equal(g.state().story.completed[1],undefined);
 // Regional encounters vary without consecutive repeats; bosses have stable identities.
 for(const [zone,pool] of Object.entries(g.E.pools))for(const previous of pool){const id=g.E.pick(zone,'random',1,previous,()=>.25);assert.ok(pool.includes(id));assert.notEqual(id,previous);}
 for(let chapter=1;chapter<=5;chapter++)assert.equal(g.E.pick('forest','boss',chapter),g.E.bosses[chapter-1]);
 // Every enemy move resolves through the real particle engine; shield/heal/poison/focus are functional.
 for(const [enemyId,definition] of Object.entries(g.E.creatures))for(let i=0;i<definition.moves.length;i++){
  const m=definition.moves[i],battle={enemyId,name:definition.name,enemy:100,maxEnemy:150,hp:100,maxHp:100,focus:4,shield:0,turn:i+1,blocked:0,enemyShield:0,playerPoison:0,settled:false};
  const test=setup({...base(),stage:'battle',battle},true);await test.move('focus');const f=test.state().battle;
  assert.equal(f.turn,i+2);assert.ok(test.draws()>100);
  if(m.shield)assert.equal(f.enemyShield,m.shield);
  if(m.heal)assert.equal(f.enemy,100+m.heal);
  if(m.poison)assert.equal(f.playerPoison,2);
  if(m.drain)assert.equal(f.focus,3);
  if(m.power)assert.ok(f.hp<100);else assert.equal(f.hp,100);
 }
 const protectedFight={enemyId:'beetle',name:'Sporenkäfer',enemy:100,maxEnemy:100,hp:100,maxHp:100,focus:4,shield:20,turn:2,blocked:0,enemyShield:0,playerPoison:0,settled:false};
 g=setup({...base(),stage:'battle',battle:protectedFight},true);await g.move('focus');assert.equal(g.state().battle.playerPoison,0);assert.equal(g.state().battle.hp,100);
 g=setup({...base(),stage:'battle',battle:{...protectedFight,shield:0,turn:1,playerPoison:2}},true);await g.move('focus');assert.equal(g.state().battle.playerPoison,1);g=setup(g.state(),true);await g.move('guard');assert.equal(g.state().battle.playerPoison,0);
 const armored={enemy:20,enemyShield:7};assert.equal(g.E.damage(armored,5).hit,0);assert.equal(armored.enemyShield,2);assert.equal(g.E.damage(armored,5).hit,3);assert.equal(armored.enemy,17);
 // Each pet has three complete talent paths, all learnable without locking out other paths.
 for(const id of ['ember','moss','tide']){
  const profile=g.P.createPet();profile.skillPoints=100;
  for(const branch of ['Angriff','Schutz','Gefährte'])assert.equal(g.P.abilities[id].filter(a=>a.branch===branch).length,3);
  for(let pass=0;pass<3;pass++)for(const a of g.P.abilities[id])g.P.unlock(profile,id,a.id);
  assert.equal(profile.unlocked.length,9);
  g.P.prepareSets(profile,id);const original=[...profile.sets[0]];
  assert.equal(g.P.equip(profile,id,0,id==='ember'?'tide-wave':'ember-wave'),false);
  assert.equal(g.P.equip(profile,id,4,profile.unlocked[0]),false);
  g.P.equip(profile,id,0,'guard');assert.equal(profile.sets[0][0],'guard');assert.equal(profile.sets[0][1],'strike');
  profile.activeSet=1;assert.deepEqual([...g.P.prepareSets(profile,id)],original);
 }
 // House interaction and travel access both open the same persistent set editor.
 g=setup({...base(),stage:'world',world:{zone:'village',positions:{}}});g.world().o.onEnter('skills');assert.ok(g.app.innerHTML.includes('Haus der Talente'));g.click('skills');assert.equal(g.state().skillOrigin,'house');
 const profile=g.state().pets.ember;profile.unlocked=g.P.abilities.ember.map(a=>a.id);profile.sets=undefined;
 g=setup({...g.state(),pets:{ember:profile}});g.click('select-set',{index:1});
 for(let slot=0;slot<4;slot++){g.click('select-slot',{index:slot});g.click('equip',{id:profile.unlocked[slot]});}
 const selected=g.state().pets.ember.sets[1];assert.equal(new Set(selected).size,4);g=setup(g.state());assert.deepEqual(g.state().pets.ember.sets[1],selected);
 g.click('world');g.click('skills');assert.equal(g.state().skillOrigin,'camp');g.click('new-battle');assert.deepEqual(g.state().battle.moves,selected);
 const snapshot=g.state();g.click('skills');g.click('select-set',{index:2});g.click('equip',{id:'strike'});assert.equal(g.state().stage,'battle');assert.deepEqual(g.state().battle.moves,selected);assert.equal(g.state().pets.ember.activeSet,1);
 await assert.rejects(()=>g.move('strike'),/Kampfset/);await assert.rejects(()=>g.move('ability','ember-phoenix'),/nicht verfügbar/);
 await g.move('focus');assert.equal(g.state().battle.focus,2);await g.move('ability',selected[0]);assert.equal(g.state().battle.turn,3);
 assert.equal(g.state().pets.ember.unlocked.length,9);g=setup(g.state());assert.deepEqual(g.state().battle.moves,snapshot.battle.moves);
 // Free destinations stay off the old paths and survive reload without snapping.
 const freeBase={...base(),stage:'world',world:{zone:'village',positions:{village:[45,56]}}};
 g=setup(freeBase);w=g.world();w.go([38,44]);g.pump(180);assert.deepEqual([...w.pos],[38,44]);assert.ok(g.W.nearest(w.map,w.pos).d>4);g=setup(g.state());assert.deepEqual([...g.world().pos],[38,44]);
 const keyEvent=key=>({key,preventDefault(){},target:{closest:()=>null}});
 // Diagonal speed equals straight movement. Releasing one key preserves the other direction.
 const straight=setup(freeBase),diagonal=setup(freeBase);straight.world().onKey(keyEvent('d'));diagonal.world().onKey(keyEvent('d'));diagonal.world().onKey(keyEvent('w'));straight.pump(20);diagonal.pump(20);
 assert.ok(Math.abs(g.W.distance([45,56],straight.world().pos)-g.W.distance([45,56],diagonal.world().pos))<.001);
 w=diagonal.world();const x=w.pos[0],y=w.pos[1];w.onKeyUp(keyEvent('d'));diagonal.pump(10);assert.equal(w.pos[0],x);assert.ok(w.pos[1]<y);w.onKeyUp(keyEvent('w'));const stopped=[...w.pos];diagonal.pump(10);assert.deepEqual([...w.pos],stopped);
 w.go([90,90]);w.onBlur();diagonal.pump(10);assert.deepEqual([...w.pos],stopped);
 // Map edges clamp safely, and joystick cancellation immediately stops motion.
 g=setup(freeBase);w=g.world();w.go([-100,300]);g.pump(500);assert.ok(g.T.walkable(w.map,w.pos));g=setup(freeBase);w=g.world();
 const pointer={pointerId:7,clientX:330,clientY:225,preventDefault(){},target:{closest:selector=>selector==='.touch-joystick'?{setPointerCapture(){}}:null}};
 w.onDown(pointer);g.pump(10);assert.ok(w.pos[0]>45);w.onUp(pointer);const released=[...w.pos];g.pump(10);assert.deepEqual([...w.pos],released);
 w.go([80,20]);w.onKey(keyEvent('a'));assert.equal(w.path.length,0);assert.equal(w.targetPlace,null);w.onBlur();
 // Water, chasms, house footprints: keyboard, stick and clicks use the same ground mask.
 for(const [zone,blocked] of Object.entries({village:[[73,23],[54,70],[76,80]],forest:[[18,30],[75,74]],canyon:[[50,70],[48,25],[52,90]],lake:[[45,25],[70,62]],pass:[[50,70],[49,25]],sanctuary:[[63,73],[47,28]]})){
  const map=g.W.maps[zone];for(const p of blocked){assert.equal(g.T.walkable(map,p),false,zone+': '+p);const safe=g.T.safe(map,p);assert.ok(g.T.walkable(map,safe));}
  for(const place of map.places){const path=g.T.route(map,map.spawn,[place.x,place.y]);assert.ok(g.W.distance(path.at(-1),[place.x,place.y])<.1);for(let i=1;i<path.length;i++)assert.ok(g.T.clear(map,path[i-1],path[i]));}
 }
 const canyon=g.W.maps.canyon;assert.ok(g.T.walkable(canyon,[49,43]));
 const across=g.T.route(canyon,[30,55],[76,80]);assert.ok(across.length>2);assert.ok(across.some(p=>p[1]<50),'Cross canyon via the bridge, not through its water');
 const stoppedAtEdge=g.T.move(canyon,[49,43],[49,85]);assert.ok(g.T.walkable(canyon,stoppedAtEdge));assert.ok(stoppedAtEdge[1]<48);
 g=setup({...base(),stage:'world',world:{zone:'canyon',positions:{canyon:[50,70]}}});assert.ok(g.T.walkable(g.W.maps.canyon,g.world().pos));assert.notDeepEqual([...g.world().pos],[50,70]);assert.deepEqual(g.state().world.positions.canyon,[...g.world().pos]);
 w=g.world();w.go([50,70]);g.pump(300);assert.ok(g.T.walkable(w.map,w.pos));
 // Chapter comics appear on first entry, survive reload and do not repeat on return visits.
 for(let id=1;id<=5;id++){
  g=setup({...base(),stage:'world',world:{zone:'village',positions:{}},story:{chapter:id,seenComics:{},nextEncounter:1000000}});g.click('journey-continue');assert.equal(g.state().stage,'interlude');assert.ok(g.app.innerHTML.includes('comic-chapter-'+id));g=setup(g.state());assert.equal(g.state().stage,'interlude');g.click('comic-continue');assert.equal(g.state().stage,'world');assert.equal(g.state().story.seenComics[id],true);g.click('return-village');g.click('journey-continue');assert.equal(g.state().stage,'world');
 }
 const sw=read('sw.js'),core=sw.match(/const CORE=(\[[^;]+\])/)[1];for(const file of vm.runInNewContext(core))assert.ok(fs.existsSync(root+'/v22/'+file.replace(/^\.\//,'').split('?')[0]),file);
 console.log('PASS: walkable maps and transitions, old/new saves, per-pet learning, fifth-task rewards, dependencies, all 27 battle abilities with real effects, three talent trees and persistent four-slot sets per pet, summons/status expiry, affection limits, retreat/loss and offline assets.');
})().catch(error=>{console.error(error);process.exit(1)});
