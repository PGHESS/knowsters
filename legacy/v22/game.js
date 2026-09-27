(()=>{'use strict';
const key='knowsters-story-v2';
const P=window.KnowstersProgress;
const Enemies=window.KnowstersEnemies;
const Story=window.KnowstersStory,Narrative=window.KnowstersNarrative,Avatar=window.KnowstersAvatar,AvatarEditor=window.KnowstersAvatarEditor,Wardrobe=window.KnowstersWardrobe,Prolog=window.KnowstersProlog;
const species=[
 {id:'moss',name:'Moos',icon:'🌿',role:'Wächter',about:'Ruhig, fürsorglich und standhaft.',hp:40,atk:7,special:'Waldschild',preference:'battle-guard',personality:'Moos schützt seine Freunde. Lob bedeutet ihm besonders viel, wenn er im Kampf einen Angriff abgefangen hat.'},
 {id:'ember',name:'Funke',icon:'🔥',role:'Angreiferin',about:'Stolz, mutig und voller Energie.',hp:33,atk:10,special:'Feuerwelle',preference:'battle',personality:'Funke ist stolz auf ihren Mut. Lob nach einem Kampf freut sie besonders – auch wenn ihr verloren habt. Ständiges Lob ohne Anlass nervt sie.'},
 {id:'tide',name:'Welle',icon:'💧',role:'Taktiker',about:'Neugierig, aufmerksam und feinfühlig.',hp:36,atk:8,special:'Heilquelle',preference:'training',personality:'Welle liebt es, etwas zu verstehen. Nach einer gelösten Aufgabe freut sie sich besonders über Lob. Sie merkt, wenn es nur dahingesagt ist.'}
];
const fresh=()=>({schemaVersion:22,stage:'prolog-intro',intro:0,chosen:null,points:0,xp:0,wins:0,losses:0,skills:{math:0,logic:0,language:0},knowledge:null,task:null,replaying:false,care:{},battle:null,eventSeq:0,prologReplay:false,prolog:{completed:false,battle:null},player:{name:'Du',ageBand:null,avatar:{face:2,hair:0,hairColor:1,top:0,pants:0},avatarCreated:false,wardrobe:{tops:[0],pants:[0]},activeCompanion:null}});
let s;try{s={...fresh(),...JSON.parse(localStorage.getItem(key)||'{}')}}catch{s=fresh()}
const loadedSchema=Number(s.schemaVersion)||0;
s.skills={math:0,logic:0,language:0,...s.skills};s.care=s.care&&typeof s.care==='object'?s.care:{};
s.schemaVersion=22;s.prologReplay=!!s.prologReplay;s.prolog=s.prolog&&typeof s.prolog==='object'?s.prolog:{completed:loadedSchema>0&&loadedSchema<15,battle:null};if(loadedSchema>0&&loadedSchema<15)s.prolog.completed=true;if(s.prolog.battle)s.prolog.battle=Prolog.hydrate(s.prolog.battle);s.player=s.player&&typeof s.player==='object'?s.player:{};s.player.name=typeof s.player.name==='string'&&s.player.name.trim()?s.player.name.trim().slice(0,32):'Du';s.player.ageBand=P.ageBands[s.player.ageBand]?s.player.ageBand:null;s.player.avatar=Avatar?.normalize(s.player.avatar||{})||{face:2,hair:0,hairColor:1,top:0,pants:0};s.player.avatarCreated=typeof s.player.avatarCreated==='boolean'?s.player.avatarCreated:!!s.chosen;s.player.wardrobe=Wardrobe.normalize(s.player.wardrobe,{top:s.player.avatar.top,pants:s.player.avatar.pants});if(!s.player.wardrobe.tops.includes(s.player.avatar.top))s.player.avatar.top=s.player.wardrobe.tops[0];if(!s.player.wardrobe.pants.includes(s.player.avatar.pants))s.player.avatar.pants=s.player.wardrobe.pants[0];
s.knowledge=P.normalizeKnowledge(s.knowledge,s.player.ageBand,s.skills);
if(s.chosen&&!species.some(p=>p.id===s.chosen))s.chosen=null;
const migrated=!s.pets;
s.pets=s.pets||{};
if(s.chosen&&!s.pets[s.chosen]){
 s.pets[s.chosen]=P.createPet({xp:s.xp,skills:s.skills,speciesId:s.chosen});
 if(migrated)s.pets[s.chosen].unlocked.push({ember:'ember-wave',moss:'moss-shield',tide:'tide-heal'}[s.chosen]);
}
for(const id of Object.keys(s.pets))s.pets[id]=P.normalizePet(s.pets[id],id);
s.world=s.world||{zone:'village',positions:{}};s.world.positions=s.world.positions||{};if(!s.player.activeCompanion&&s.chosen)s.player.activeCompanion=s.chosen;if(s.player.activeCompanion&&!species.some(p=>p.id===s.player.activeCompanion))s.player.activeCompanion=s.chosen||null;
s.story=Story.hydrate(s.story);if(s.story.claimed?.welcome){const migratedOutfit=Wardrobe.unlock(s.player.wardrobe,'top',1,'Enos Willkommensausstattung');s.player.wardrobe=migratedOutfit.wardrobe;}s.wardrobeOrigin=['world','pet','skills','journal','dialog','task'].includes(s.wardrobeOrigin)?s.wardrobeOrigin:'world';
if(!s.story.seenComics){s.story.seenComics={};for(let i=1;i<(s.story.chapter||1);i++)s.story.seenComics[i]=true;const visited=Story.forZone(s.world.zone);if(visited)s.story.seenComics[visited.id]=true;for(const zone of Object.keys(s.world.positions)){const c=Story.forZone(zone);if(c)s.story.seenComics[c.id]=true;}}
s.lessons=s.lessons||{};s.dialog=s.dialog||null;
const hydrateTask=q=>{if(!q||typeof q!=='object')return q;if(!q.status)q.status=q.complete?'correct':q.attempts?'wrong':'open';if(q.status==='wrong'){q.correctIndex=Number.isInteger(q.correctIndex)?q.correctIndex:q.options?.indexOf(q.answer);q.wrongIndex=Number.isInteger(q.wrongIndex)?q.wrongIndex:null;}return q;};
for(const id of Object.keys(s.lessons))s.lessons[id]=hydrateTask(s.lessons[id]);s.task=hydrateTask(s.task);
if(s.task&&s.chosen&&!s.lessons[s.chosen+':'+s.task.kind])s.lessons[s.chosen+':'+s.task.kind]=s.task;
let selected=s.chosen||'moss',fight=s.battle||null,task=s.task||null,notice='',bondLine='',bondDelta=null,careMood='',busy=false,fx=null,world=null,prologFxTimer=null,prologEnemyBusy=false,prologEnemyToken=0,avatarDraft={...s.player.avatar};
let selectedSlot=0;
let trainingKind=P.domains[s.trainingKind]?s.trainingKind:(P.domains[task?.kind]?task.kind:'math');
const pet=()=>{const id=s.chosen||selected;return s.pets[id]||(s.pets[id]=P.createPet({speciesId:id}));};
let trainingAttribute=P.validTrainingAttributes(trainingKind).includes(s.trainingAttribute)?s.trainingAttribute:P.defaultAttribute(trainingKind,pet());
const growth=(id)=>Math.max(0,(pet().attributes?.[id]?.value||0)-(P.startTemplates[get().id]?.[id]||0));
const baseAttack=()=>get().atk+Math.floor(growth('attack')/15);
const baseGuard=()=>8+Math.floor(growth('defense')/15);
const maxLife=()=>get().hp+Math.floor(growth('vitality')/10);
const book=()=>P.abilities[get().id];
const known=()=>book().filter(a=>pet().unlocked.includes(a.id));
const equipped=()=>fight?.moves||P.prepareSets(pet(),get().id);
const activeAbilities=()=>equipped().map(id=>book().find(a=>a.id===id)).filter(Boolean);
const abilityCost=a=>a.focus;
function syncPet(){if(s.chosen){s.xp=pet().xp;s.skills=pet().solved;}}

const app=document.getElementById('app');
const get=()=>species.find(x=>x.id===(s.chosen||selected))||species[0];
const art=(id,cls='')=>`<span class="pet-art ${id} ${cls}" role="img" aria-label="${species.find(x=>x.id===id)?.name||'Wesen'}"></span>`;
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent=(a,b)=>Math.max(0,Math.min(100,a/b*100));
const level=()=>Math.floor(pet().xp/10)+1, xpInLevel=()=>pet().xp%10;
function care(){const id=get().id;if(!s.care[id])s.care[id]={bond:Math.min(100,Math.max(0,Number(s.bond)||0)),lastComfortAt:null,lastContactAt:null,context:null};return s.care[id];}
function save(){syncPet();s.battle=fight;s.task=task;s.trainingKind=trainingKind;s.trainingAttribute=trainingAttribute;s.knowledge.ageBand=s.player.ageBand;if(task&&s.chosen)s.lessons[s.chosen+':'+task.kind]=task;try{localStorage.setItem(key,JSON.stringify(s))}catch{}}
// Old versions did not save active fights or tasks. Keep earned progress and recover safely.
if(['battle','result'].includes(s.stage)&&!fight){s.stage=s.chosen?'world':s.player.avatarCreated?'choose':'intro';notice='Dein Wesen wartet in Lichtquell. Du kannst den Wald erkunden.';}
if(s.stage==='hub')s.stage='world';
if(!['prolog-intro','prolog-battle','prolog-result','prolog-after','intro','avatar','choose','battle','result','world','pet','skills','task','spring','encounter','dialog','journal','ending','interlude','wardrobe','knowledge'].includes(s.stage))s.stage=s.chosen?'world':s.player.avatarCreated?'choose':s.prolog.completed?'avatar':'prolog-intro';
if(s.stage==='choose'&&!s.player.avatarCreated)s.stage=s.prolog.completed?'avatar':'prolog-intro';
if(['world','pet','skills','task','battle','result','spring','encounter','dialog','journal','ending','interlude','wardrobe','knowledge'].includes(s.stage)&&!s.chosen)s.stage=s.player.avatarCreated?'choose':s.prolog.completed?'avatar':'prolog-intro';
if(fight?.pending){fight={...fight.pending};s.battle=fight;}
if(s.chosen)P.prepareSets(pet(),get().id);
if(fight&&!Array.isArray(fight.moves))fight.moves=[...P.prepareSets(pet(),get().id)];
if(fight)fight={summon:null,dot:null,weaken:0,reflect:0,enemyShield:0,playerPoison:0,...fight,enemyId:fight.enemyId||'mist'};
const header=()=>`<div class="top"><div class="logo">KNOW<span>STERS</span></div>${s.chosen?`<div class="top-info"><span class="currency">◈ ${s.points}</span><button class="pet-chip" data-action="pet-view" ${s.stage==='battle'?'disabled':''}>${get().icon} ${get().name} · ${level()}</button></div>`:'<small>Urban Pulse · v17</small>'}</div>`;
const button=(action,label,klass='primary')=>`<button class="${klass}" data-action="${action}">${label}</button>`;
const enemyName=()=>fight?.name||'Nebelrufer';
const areaChapter=()=>Story.forZone(s.world.zone)||Story.current(s.story);
function careMarkup(){const p=get(),c=care();return `<div class="bond-actions"><button class="nuzzle-btn" data-action="praise">${p.name} loben</button><button class="nuzzle-btn" data-action="cuddle">Kuscheln ♡</button></div><div class="bond-meter" role="meter" aria-label="Bindung" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${c.bond}"><i style="width:${c.bond}%"></i></div><span class="muted">Bindung ${c.bond} / 100</span><div class="bond-box ${bondDelta>0?'positive':bondDelta<0?'negative':''}" role="status">${bondDelta!==null?`<span class="care-number">${bondDelta>0?'Bindung +'+bondDelta:bondDelta<0?'Bindung '+bondDelta:'Bindung unverändert'}</span>`:''}<p>${esc(bondLine||`${p.name} schaut zu dir. Wie fühlt sich dieser Moment an?`)}</p></div>`;}
function intent(){const m=Enemies.intent(fight);return `Nächster Zug: ${m.name}${m.shield?' · Schild +'+m.shield:m.heal?' · Heilung +'+m.heal:m.power?' · '+(m.power+(fight.attackBonus||0))+'–'+(m.power+(fight.attackBonus||0)+2)+' Schaden':' · Vorbereitung'}${m.poison?' · Gift':m.drain?' · Fokusraub':''}`;}
function battleMarkup(){const p=get(),atk=baseAttack();return `
 <div class="battle-heading"><div><div class="kicker">${fight.first?'Deine erste Begegnung':fight.kind==='random'?'Überraschung am Weg':areaChapter().place}</div><h1>${enemyName()}</h1><p>${Enemies.get(fight.enemyId).hint}</p></div></div>
 <section class="panel battle-shell">
 <div class="battle-stage" aria-label="${p.name} steht links, ${enemyName()} rechts. Beide sehen sich an.">
  <div class="battle-hud own"><div class="hud-name"><strong>${p.name}</strong><small>Stufe ${level()}</small></div><div class="hp"><i data-hp="own" style="width:${percent(fight.hp,fight.maxHp)}%"></i></div><span class="hp-copy" data-hp-copy="own">${fight.hp} / ${fight.maxHp} LP</span></div>
  <div class="battle-hud enemy"><div class="hud-name"><strong>${enemyName()}</strong><small>${Enemies.get(fight.enemyId).type}</small></div><div class="hp"><i data-hp="enemy" style="width:${percent(fight.enemy,fight.maxEnemy)}%"></i></div><span class="hp-copy" data-hp-copy="enemy">${fight.enemy} / ${fight.maxEnemy} LP</span></div>
  <span class="round-label">RUNDE <span data-round>${fight.turn}</span></span>
  <div class="battle-actor player" data-id="${p.id}"><div class="actor-facing"><div class="combat-sprite" data-pose="idle" role="img" aria-label="${p.name} in Kampfhaltung"></div></div><div class="shield-aura ${fight.shield>0?'active':''}"></div></div>
  <div class="battle-actor opponent ${Enemies.get(fight.enemyId).sprite>=0?'regional-enemy':''}" data-id="enemy" data-enemy="${fight.enemyId}" style="--enemy-x:${(Enemies.get(fight.enemyId).sprite%3)*50}%;--enemy-y:${Math.floor(Enemies.get(fight.enemyId).sprite/3)*50}%"><div class="actor-facing"><div class="combat-sprite" data-pose="idle" role="img" aria-label="${enemyName()} in Kampfhaltung"></div></div><div class="shield-aura enemy-shield ${(fight.enemyShield||0)>0?'active':''}"></div></div>
  <div class="summoned-ally" ${fight.summon?'':'hidden'}>${art(p.id)}<span class="ally-caption">${fight.summon?.name||''}</span></div><canvas class="battle-effects" aria-hidden="true"></canvas><div class="battle-callout">${p.name} wartet auf deinen Zug.</div>
 </div>
 <div class="battle-console"><div class="battle-status"><span>Fokus <span class="focus-pips">${[0,1,2,3].map(i=>`<i class="${i<fight.focus?'filled':''}"></i>`).join('')}</span><span data-focus>${fight.focus}</span>/4 · Schild <span data-shield>${fight.shield}</span></span><span class="intent">${intent()}</span></div>
 <div class="moves equipped-moves">${equipped().map((id,i)=>{const ability=book().find(a=>a.id===id),basic=window.KnowstersSkillsUI.basic[id];return ability?`<button class="move special" data-action="ability" data-id="${ability.id}" ${fight.focus<ability.focus?'disabled':''}><span class="move-name">${ability.icon} ${ability.name}</span><small>${ability.focus} Fokus · Platz ${i+1}</small></button>`:basic?`<button class="move" data-action="${id}"><span class="move-name">${basic.icon} ${id==='strike'?(p.id==='ember'?'Glutstoß':p.id==='tide'?'Wasserstoß':'Rankenstoß'):basic.name}</span><small>${id==='strike'?atk+'–'+(atk+3)+' Schaden · +1 Fokus':id==='guard'?baseGuard()+' Schild · +1 Fokus':'+2 Fokus · kein Schutz'}</small></button>`:`<button class="move empty-slot" disabled><span class="move-name">Platz ${i+1} frei</span><small>Vor dem Kampf belegen</small></button>`;}).join('')}</div>
 <div class="log" role="status" aria-live="polite"><p>${esc(fight.log)}</p></div><div class="battle-conditions">${conditionText()}</div><div class="battle-exit">${!equipped().includes('focus')?button('focus','Atemholen · +2 Fokus','secondary'):''}${button('retreat','Zurück auf den Weg','secondary')}</div></div></section>`;}
function navMarkup(){return `<nav class="game-nav" aria-label="Spielbereiche">${[['world','⌂ Welt','world'],['pet',get().icon+' '+get().name,'pet-view'],['knowledge','▣ Wissen','knowledge'],['skills','✦ Fähigkeiten','skills'],['wardrobe','◆ Stil','wardrobe-open']].map(([id,label,action])=>`<button data-action="${action}" class="${s.stage===id?'active':''}" ${s.stage===id?'aria-current="page"':''}>${label}${id==='skills'&&pet().skillPoints?`<span class="nav-count">${pet().skillPoints}</span>`:''}</button>`).join('')}</nav>`;}
function wardrobeMarkup(){return AvatarEditor.markup(avatarDraft,s.player.wardrobe,{mode:'wardrobe'});}
function unlockClothing(type,id,source){const result=Wardrobe.unlock(s.player.wardrobe,type,id,source);s.player.wardrobe=result.wardrobe;return result.unlocked;}
function screenTop(kicker,title){return `<div class="screen-top"><div><div class="kicker">${kicker}</div><h1>${title}</h1></div>${button('world','Zur Welt','secondary')}</div>`;}
function attributeMarkup(profile){const total=P.attributeDefs.reduce((sum,d)=>sum+profile.attributes[d.id].potential,0);return `<section class="attribute-sheet panel"><div class="attribute-sheet-head"><div><div class="kicker">Individuelles Potenzial</div><h2>Wesenswerte</h2></div><strong>${total.toLocaleString('de-DE')} / 8.000</strong></div><div class="attribute-grid">${P.attributeDefs.map(d=>{const a=profile.attributes[d.id],need=P.attributeCost(a.value),pct=a.potential<=a.value?100:Math.min(100,a.progress/need*100);return `<article class="attribute-row attr-${d.id}"><div class="attribute-title"><span>${d.short}</span><strong>${d.label}</strong><b>${a.value}</b></div><div class="attribute-progress"><i style="width:${pct}%"></i></div><small>${a.value>=a.potential?'Potenzial erreicht':`${a.progress} / ${need} Entwicklung · Maximum ${a.potential}`}</small></article>`;}).join('')}</div><p class="attribute-note">Jedes Wesen besitzt insgesamt 8.000 mögliche Attributpunkte, aber eine eigene Verteilung. Element und Art geben Tendenzen vor; einzelne Wesen können deutlich davon abweichen.</p></section>`;}
function petMarkup(){const p=get(),profile=pet();return `${screenTop('Dein Gefährte',p.name)}<section class="panel pet-card"><div class="petview care-reaction ${careMood}">${art(p.id,'big')}${careMood==='happy'?'<span class="care-symbol">♡</span>':''}</div><div class="pet-summary"><h2>${p.role} · Stufe ${level()}</h2><p class="personality">${esc(p.personality)}</p><div class="progress-meta"><span>Erfahrung</span><span>${xpInLevel()} / 10 EP</span></div><div class="skillbar"><i style="width:${xpInLevel()*10}%"></i></div>${careMarkup()}</div></section>${attributeMarkup(profile)}<p class="note">Richtige Wissensaufgaben geben normalerweise <strong>+2 Entwicklung</strong> für ein passendes Attribut. Höhere Attributswerte brauchen zunehmend mehr Entwicklung.</p><div class="toolbar">${button('knowledge','Wissen trainieren →')}${button('skills','Fähigkeiten ansehen →')}${button('replay-prolog','Prolog erneut spielen','secondary')}${button('replay-intro','Alte Comicfassung','secondary')}</div>`;}
function curriculumPathMarkup(kind,state,currentTier){const start=P.ageStartTier(s.player.ageBand,kind);return `<details class="curriculum-path"><summary>8 Themenstufen ansehen</summary><ol>${P.curriculum[kind].map((stage,i)=>{const stats=state.topics?.[stage.id]||{correct:0,wrong:0,attempts:0},cls=[i===currentTier?'current':'',i===start?'age-start':'',stats.attempts?'practiced':''].filter(Boolean).join(' ');return `<li class="${cls}"><span class="curriculum-step">${i+1}</span><div><strong>${esc(stage.title)}</strong><small>${esc(stage.goal)}</small><em>${esc(P.difficultyLabels[i])}${i===start?' · Altersstart':''}${stats.attempts?` · ${stats.correct}✓ ${stats.wrong}×`:''}</em></div></li>`;}).join('')}</ol></details>`;}
function knowledgeMarkup(){const band=s.player.ageBand?P.ageBands[s.player.ageBand]:null,age=band?.label||'noch nicht festgelegt';return `${screenTop('Dein Wissensprofil','10 Wissenswelten')}<section class="panel knowledge-summary"><div><h2>Startschätzung: ${esc(age)}</h2><p>Dein Alter setzt nur den ersten Einstieg. Danach passt sich jedes Fach separat an: drei richtige Antworten in Folge können eine Stufe anheben, zwei falsche Antworten in Folge eine Stufe senken. Auch Erwachsene beginnen nicht bei „fertig“ – die oberen Stufen enthalten Transfer, Quellenprüfung und neues Wissen.</p></div><div class="age-inline">${Object.entries(P.ageBands).map(([id,b])=>`<button data-action="age-band" data-id="${id}" class="${s.player.ageBand===id?'selected':''}" aria-pressed="${s.player.ageBand===id}">${b.label}</button>`).join('')}</div></section><div class="knowledge-grid">${Object.entries(P.domains).map(([id,d])=>{const state=s.knowledge.domains[id],track=P.knowledgeTrack(id,s.knowledge,s.player.ageBand),attrs=d.attributes.map(a=>P.attributeMap[a].label).join(' · ');return `<article class="knowledge-card panel"><div class="knowledge-card-main"><div class="knowledge-icon">${d.icon}</div><div class="knowledge-copy"><div class="knowledge-level">Stufe ${track.tier+1}/8 · ${esc(track.difficulty)}</div><h3>${d.label}</h3><p>${esc(track.title)}</p><small>${esc(track.goal)}</small><span>${state.correct} richtig · ${state.wrong} Lernschritte</span><span class="knowledge-attrs">Trainiert: ${attrs}</span></div><button class="secondary" data-action="knowledge-start" data-kind="${id}">Trainieren</button></div>${curriculumPathMarkup(id,state,track.tier)}</article>`;}).join('')}</div><p class="note">Die Themenpfade sind kein starrer Schulklassenplan. Sie dienen als adaptive Orientierung: Bekanntes wird übersprungen, Unsicheres kann wiederholt werden und fortgeschrittene Stufen sollen ausdrücklich neues Wissen vermitteln.</p>`;}
function skillMarkup(){return window.KnowstersSkillsUI.render({id:get().id,name:get().name,profile:pet(),slot:selectedSlot,origin:s.skillOrigin,notice});}
function trainingMarkup(){return Narrative.teacher({kind:task?.kind||trainingKind,petName:get().name,profile:pet(),knowledge:s.knowledge,task,points:s.points,about:!!s.teacherAbout,notice,bondLine,bondDelta,targetAttribute:task?.attributeId||trainingAttribute});}
function visitRegion(zone){s.world.zone=zone;const c=Story.forZone(zone);s.stage=c&&!s.story.seenComics[c.id]?'interlude':'world';}
function enterPlace(id){
 notice='';
 if(['math','logic','language'].includes(id)){if(task)s.lessons[get().id+':'+task.kind]=task;trainingKind=id;task=s.lessons[get().id+':'+id]||null;s.teacherAbout=false;s.stage='task';}
 else if(id==='rest'){s.dialog={type:'home'};s.stage='dialog';}
 else if(id==='skills'){s.skillOrigin='house';s.dialog={type:'skills'};s.stage='dialog';}
 else if(id==='forest'||id==='village'){visitRegion(id==='forest'?Story.current(s.story).zone:'village');}
 else if(id==='guide'){s.dialog={type:'guide',step:'ask'};s.stage='dialog';}
 else if(id==='resident'){s.dialog={type:'resident',chapter:areaChapter().id,step:'ask'};s.stage='dialog';}
 else if(id==='encounter'){s.encounter={kind:'boss',chapter:areaChapter().id,zone:s.world.zone};s.stage='encounter';}
 else if(id==='spring')s.stage='spring';
 save();render();
}
function dialogueMarkup(){
 const d=s.dialog||{type:'guide',step:'ask'};
 if(d.type==='resident')return Narrative.resident({chapter:Story.chapters[d.chapter-1],dialog:d,story:s.story});
 if(d.type==='guide')return Narrative.guide({dialog:d,story:s.story});
 if(d.type==='traveler')return Narrative.traveler({dialog:d});
 if(d.type==='home')return Narrative.scene({npc:'herbalist',location:'Lichtquell · im Kräuterhaus',text:'„Kommt herein. Ihr dürft hier einfach einmal durchatmen. Schau nach deinem Gefährten – vielleicht möchte er Nähe, vielleicht auch seine Ruhe.“',choices:Narrative.reply('pet-view',`„Ich möchte mich um ${get().name} kümmern.“`)+Narrative.reply('world','„Danke, wir gehen noch etwas spazieren.“')});
 if(d.type==='skills')return Narrative.scene({npc:'guide',location:'Lichtquell · Haus der Talente',text:'„Was dein Gefährte lernt, wird irgendwann zu einer neuen Möglichkeit. Nach jeweils fünf gelösten Aufgaben kannst du einen Fähigkeitspunkt einsetzen – oder ihn für später aufheben.“',choices:Narrative.reply('skills','„Zeig mir die Talente meines Gefährten.“')+Narrative.reply('world','„Ich komme später wieder.“')});
 return Narrative.scene({npc:'guide',location:areaChapter().place,outdoors:true,text:esc(d.result?.response||'Ein neuer Weg liegt vor euch.'),body:d.result?.reward?`<p class="dialog-gift">+${d.result.reward} Wissenspunkte</p>`:'',choices:(d.type==='chapter-end'?Narrative.reply('chapter-gate',s.story.chapter===5?'Die Geschichte zu Ende führen':'Dem nächsten Weg folgen'):'')+Narrative.reply('world','Weiter durch die Welt')});
}
function chapterGate(){
 const c=areaChapter();
 if(!s.story.completed[c.id]){notice=!s.story.met[c.id]?`Bevor ihr weiterzieht, möchtet ihr noch ${Story.residents[c.npc].name} kennenlernen.`:'Die Begegnung an diesem Weg ist noch nicht geklärt.';s.stage='world';save();render();return;}
 Story.advance(s.story,c.id);Story.resetTravel(s.story);
 if(c.id===5)s.stage='ending';else{visitRegion(Story.chapters[c.id].zone);notice=Story.chapters[c.id].intro;}
 save();render();
}
function travelEvent(delta,position){
 if(s.stage!=='world'||s.world.zone==='village')return;
 const map=KnowstersWorld.maps[s.world.zone],safe=map.places.some(p=>Math.hypot((p.x-position[0])*1.5,p.y-position[1])<9);
 const event=Story.travel(s.story,s.world.zone,delta,safe);if(!event)return;
 s.world.positions[s.world.zone]=position;
 if(event==='attack'){newFight(false,{kind:'random',zone:s.world.zone,chapter:areaChapter().id});return;}
 if(event==='traveler')s.dialog={type:'traveler',chapter:areaChapter().id,step:'ask'};
 else{const id='discovery-'+areaChapter().id,reward=s.story.claimed[id]?0:1;s.story.claimed[id]=true;s.points+=reward;s.dialog={type:'discovery',step:'reply',result:{response:reward?'Zwischen den Steinen findet ihr eine alte Notiz: „Frag erst, bevor du urteilst.“ Ihr nehmt den Gedanken mit.':'Am Weg entdeckt ihr dieselben Zeichen wie zuvor. Euer Gefährte erkennt sie wieder.',reward}};}
 s.stage='dialog';save();render();
}


const prologReducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const prologPause=ms=>new Promise(resolve=>setTimeout(resolve,prologReducedMotion()?Math.min(ms,90):ms));
async function runPrologEnemyPhase(){
 if(prologEnemyBusy||s.stage!=='prolog-battle'||s.prolog.battle?.phase!=='enemy')return;
 prologEnemyBusy=true;busy=true;const token=++prologEnemyToken;
 try{
  await prologPause(420);
  while(token===prologEnemyToken&&s.stage==='prolog-battle'&&s.prolog.battle?.phase==='enemy'){
   const step=Prolog.nextEnemyAction(s.prolog.battle);save();render();
   await prologPause(step?.newRound?420:680);
   if(s.prolog.battle?.result){s.stage='prolog-result';save();render();break;}
  }
 }catch(error){console.error('Prolog enemy phase interrupted',error);}
 finally{if(token===prologEnemyToken){prologEnemyBusy=false;busy=false;}}
}
function render(){
 if(world){const old=world;world=null;old.destroy();}
 let html=header();
 if(s.stage==='prolog-intro'){
  html+=Prolog.introMarkup();
 }else if(s.stage==='prolog-battle'){
  html+=Prolog.battleMarkup(s.prolog.battle);
 }else if(s.stage==='prolog-result'){
  html+=Prolog.resultMarkup(s.prolog.battle);
 }else if(s.stage==='prolog-after'){
  html+=Prolog.afterMarkup();
 }else if(s.stage==='intro'){
  html+=window.KnowstersComics.opening(s.intro,s.replaying);
 }else if(s.stage==='avatar'){
  html+=AvatarEditor.markup(avatarDraft,s.player.wardrobe,{ageBand:s.player.ageBand});
 }else if(s.stage==='wardrobe'){
  html+=wardrobeMarkup();
 }else if(s.stage==='choose'){
  html+=`<div class="heading center"><div class="kicker">Dein erster Gefährte</div><h1>Wer kommt mit dir?</h1><p>Jedes Wesen hat seinen eigenen Charakter. Lernen und gemeinsame Erlebnisse verbinden euch.</p></div><div class="roster">${species.map(p=>`<button class="choice ${selected===p.id?'selected':''}" data-action="select" data-id="${p.id}" aria-pressed="${selected===p.id}"><span class="icon">${art(p.id,'portrait')}</span><strong>${p.name}</strong><small>${p.role} · ${p.about}</small></button>`).join('')}</div><p class="note">Du kannst den ersten Kampf gewinnen oder verlieren. Eure Geschichte geht in beiden Fällen weiter.</p>${button('choose','Mit '+get().name+' losziehen →')}`;
 }else if(s.stage==='battle')html+=battleMarkup();
 else if(s.stage==='result'){
  const p=get();html+=`<section class="panel result center"><div class="result-art-pet">${art(p.id)}</div><div class="kicker">${fight.won?'Sieg':'Ein Rückschlag'}</div><h1>${fight.won?'Ihr habt standgehalten.':'Ihr zieht euch zurück.'}</h1><p>${fight.won?`${enemyName()} hält inne. Für einen Moment scheint das Wesen sich daran zu erinnern, wie man einander zuhört.`:'Dein Wesen hat alles gegeben. In Lichtquell könnt ihr euch erholen und weiterlernen.'}</p><div class="reward">+${fight.award} Wissenspunkte</div>${fight.kind==='boss'&&fight.won?`<p class="dialog-gift">Die Begegnung in ${Story.chapters[fight.chapter-1].place} ist geklärt.</p>`:''}<p>${esc(p.personality)}</p>${careMarkup()}<div class="toolbar">${button('world',fight.won&&!fight.first?'Die Reise fortsetzen →':'Zurück nach Lichtquell →')}</div></section>`;
 }else if(s.stage==='world'){
  const c=areaChapter();html+=`<button class="journey-strip" data-action="journal"><span>Kapitel ${c.id} / 5 · ${c.title}</span><small>${s.story.completed[c.id]?'✓ Weg geklärt – am Ziel weiterreisen':s.world.zone==='village'?'Sprich mit Eno am Brunnen oder besuche die Lehrpersonen.':!s.story.met[c.id]?`Finde ${Story.residents[c.npc].name}.`:'Kläre die Begegnung am Ende des Wegs.'}</small></button>${notice?`<div class="world-notice" role="status">${esc(notice)}</div>`:''}<section class="world-shell" id="world-container" data-zone="${s.world.zone}"></section>`;
 }else if(s.stage==='pet')html+=petMarkup();
 else if(s.stage==='knowledge')html+=knowledgeMarkup();
 else if(s.stage==='skills')html+=skillMarkup();
 else if(s.stage==='task')html+=trainingMarkup();
 else if(s.stage==='interlude')html+=window.KnowstersComics.transition(areaChapter().id);
 else if(s.stage==='dialog')html+=dialogueMarkup();
 else if(s.stage==='journal')html+=Narrative.journal(s.story);
 else if(s.stage==='ending')html+=Narrative.scene({npc:'guide',location:'Kapitel 5 · Ein neuer Anfang',outdoors:true,text:'„Ihr habt fünf Wege zurückgelegt. Nicht jede Antwort war leicht, und nicht jeder Streit war sofort vorbei. Bildung macht euch stark: Ihr fragt nach, prüft Behauptungen und lernt miteinander. Das Spiegelnetz kann euch dabei helfen – wenn ihr selbst entscheidet, wofür ihr es nutzt. Nicht jede Auseinandersetzung verschwindet durch Wissen. Aber ihr habt mehr Möglichkeiten als Angst und Gewalt.“',body:`<p class="spoken-aside">${get().name} lehnt sich an dich. Im Morgenhain beginnt der Kristall zu leuchten.</p><p class="dialog-gift">Die fünf Kapitel sind abgeschlossen. Eure Fähigkeiten und Erinnerungen bleiben erhalten.</p>`,choices:Narrative.reply('return-village','„Wir kehren nach Lichtquell zurück.“')+Narrative.reply('journal','Die gemeinsamen Erinnerungen ansehen')});
 else if(s.stage==='spring')html+=`<section class="panel field-dialog"><div class="kicker">Die stille Quelle</div><h1>Ein Moment Ruhe.</h1><p>${get().name} lauscht dem Wasser. Von hier führt der Weg zur alten Ruine – dort wartet der Nebelrufer.</p>${button('pet-view','Bei deinem Wesen bleiben','secondary')}<div class="toolbar">${button('world','Weitergehen →')}</div></section>`;
 else if(s.stage==='encounter')html+=Narrative.boss({chapter:areaChapter(),story:s.story});
 if(s.chosen&&!['prolog-intro','prolog-battle','prolog-result','prolog-after','intro','avatar','choose','battle','result','interlude'].includes(s.stage))html+=navMarkup();

 app.innerHTML=html;
 fx=s.stage==='battle'?new KnowstersFX(app.querySelector('.battle-stage')):null;
 if(s.stage==='world'){
  const zone=s.world.zone;
  world=new KnowstersWorld.World(app.querySelector('#world-container'),{zone,pet:s.player.activeCompanion||get().id,petName:get().name,avatar:s.player.avatar,position:s.world.positions[zone],onSave:pos=>{s.world.positions[zone]=pos;save();},onEnter:enterPlace,onTravel:travelEvent});
 }
 if(s.stage==='prolog-battle'&&s.prolog.battle){
  const b=s.prolog.battle;
  if(!b.introPlayed){b.introPlayed=true;save();}
  if(Array.isArray(b.fxEvents)&&b.fxEvents.length&&b.phase!=='enemy'){
   const seq=b.eventSeq;clearTimeout(prologFxTimer);prologFxTimer=setTimeout(()=>{if(s.stage==='prolog-battle'&&s.prolog.battle?.eventSeq===seq&&s.prolog.battle.phase!=='enemy'){s.prolog.battle.fxEvents=[];s.prolog.battle.fx=null;save();}},1100);
  }
  if(b.phase==='enemy'&&!prologEnemyBusy)setTimeout(()=>void runPrologEnemyPhase(),0);
 }

}
function recordContext(type,extra={}){care().context={id:++s.eventSeq,type,at:Date.now(),praised:false,...extra};}
function contact(kind){
 if(!['pet','result','task'].includes(s.stage))return;
 const p=get(),c=care(),now=Date.now(),event=c.context;
 const recent=event&&now>=event.at&&now-event.at<=30*60*1000;
 const matches=recent&&(p.preference===event.type||(p.preference==='battle-guard'&&event.type==='battle'&&event.blocked>0));
 const comfortReady=c.lastComfortAt===null||now-c.lastComfortAt>=6*60*60*1000;
 const repeated=c.lastContactAt!==null&&now-c.lastContactAt<10*60*1000;
 let delta=0,line='';
 if(kind==='praise'&&matches&&!event.praised){
  delta=3;event.praised=true;
  line=p.id==='ember'?'Funke richtet sich stolz auf. Du hast gesehen, wie mutig sie gekämpft hat.':p.id==='tide'?'Welle strahlt. Dass du ihren Lernfortschritt bemerkst, bedeutet ihr viel.':'Moos lehnt sich zufrieden zu dir. Du hast bemerkt, wie gut er euch geschützt hat.';
 }else if(kind==='praise'&&recent&&event.praised){
  delta=0;line=`${p.name} hat dein Lob schon gehört. Für diesen Moment reicht das – die Bindung bleibt unverändert.`;
 }else if(comfortReady){
  delta=1;c.lastComfortAt=now;
  if(kind==='praise'&&recent)event.praised=true;
  line=kind==='cuddle'?({moss:'Moos legt den Kopf in deine Hand und genießt die Nähe.',ember:'Funke lässt die Schultern sinken und schmiegt sich kurz an dich.',tide:'Welle stupst deine Hand an und kuschelt sich zufrieden zu dir.'}[p.id]):`${p.name} freut sich über deine freundlichen Worte. Ein kleiner Moment nur für euch.`;
 }else if(kind==='praise'||repeated){
  delta=0;line=kind==='praise'?(p.id==='ember'?'Funke hört dich, braucht aber gerade kein weiteres Lob.':'Dein Begleiter nimmt die Worte wahr. Ein ehrlicher Moment genügt – ihr müsst nichts wiederholen.'):`${p.name} weicht sanft zurück. Gerade ist genug Nähe. Du gibst deinem Begleiter Raum.`;
 }else{line=`${p.name} mag dich, möchte sich gerade aber lieber ausruhen. Ihr müsst nicht ständig kuscheln.`;}
 const old=c.bond;c.bond=Math.min(100,Math.max(0,c.bond+delta));bondDelta=c.bond-old;
 // Keep the reaction meaningful even at the lower/upper boundary.
 bondLine=line;c.lastContactAt=now;careMood=delta>0?'happy':delta<0?'reserved':'';save();render();
}
function newFight(first=false,encounter=null){
 const p=get(),maxHp=maxLife();
 const chapter=encounter?.chapter||1,kind=encounter?.kind||'practice',zone=encounter?.zone||s.world.zone;
 const enemyId=Enemies.pick(zone,kind,chapter,s.story.lastEnemy),definition=Enemies.get(enemyId),name=definition.name;
 if(kind==='random')s.story.lastEnemy=enemyId;
 const enemy=first?31:kind==='practice'?35+s.wins*3:definition.hp+(kind==='random'?(chapter-1)*2:0);
 fight={moves:[...P.prepareSets(pet(),get().id)],first,kind,chapter,zone,name,enemyId,enemyShield:0,playerPoison:0,attackBonus:kind==='practice'?0:Math.floor((chapter-1)/2),won:false,award:0,hp:maxHp,maxHp,enemy,maxEnemy:enemy,focus:0,shield:0,turn:1,blocked:0,summon:null,dot:null,weaken:0,reflect:0,log:`${p.name} steht ${name} gegenüber. Dein Zug.`,settled:false};
 bondLine='';bondDelta=null;careMood='';notice='';s.stage='battle';save();render();
}
function updateBattle(){
 for(const [side,value,max] of [['own',fight.hp,fight.maxHp],['enemy',fight.enemy,fight.maxEnemy]]){
  app.querySelector(`[data-hp="${side}"]`).style.width=percent(value,max)+'%';app.querySelector(`[data-hp-copy="${side}"]`).textContent=`${value} / ${max} LP`;
 }
 app.querySelector('[data-focus]').textContent=fight.focus;app.querySelector('[data-shield]').textContent=fight.shield;app.querySelector('[data-round]').textContent=fight.turn;
 app.querySelectorAll('.focus-pips i').forEach((el,i)=>el.classList.toggle('filled',i<fight.focus));
 app.querySelector('.shield-aura').classList.toggle('active',fight.shield>0);
 app.querySelector('.enemy-shield').classList.toggle('active',(fight.enemyShield||0)>0);
 app.querySelector('.intent').textContent=intent();app.querySelector('.log p').textContent=fight.log;
 app.querySelectorAll('.move').forEach(btn=>{const a=book().find(x=>x.id===btn.dataset.id);btn.disabled=busy||!btn.dataset.action||(btn.dataset.action==='ability'&&(!a||fight.focus<a.focus));});
 app.querySelector('[data-action="retreat"]').disabled=busy;
 app.querySelector('.battle-conditions').textContent=conditionText();
 const ally=app.querySelector('.summoned-ally');ally.hidden=!fight.summon;ally.querySelector('.ally-caption').textContent=fight.summon?`${fight.summon.name} · ${fight.summon.turns}`:'';

}
function endFight(won){
 if(fight.settled)return;
 fight.settled=true;fight.won=won;fight.award=won?4:2;s.points+=fight.award;if(won)s.wins++;else s.losses++;
 if(won&&fight.kind==='boss')Story.resolve(s.story,fight.chapter,'battle');
 Story.resetTravel(s.story);
 recordContext('battle',{won,blocked:fight.blocked});s.stage='result';busy=false;delete fight.pending;save();render();
}
function conditionText(){return [fight.enemyShield?`Gegnerschild: ${fight.enemyShield}`:'',fight.playerPoison?`Gift: ${fight.playerPoison} Runden · 2 Schaden`:'',fight.summon?`${fight.summon.name}: ${fight.summon.turns} Runden`:'',fight.dot?`${fight.dot.name}: ${fight.dot.turns} Runden`:'',fight.weaken?`Gegner geschwächt: ${fight.weaken} Runden`:'',fight.reflect?'Gegenangriff vorbereitet':''].filter(Boolean).join(' · ');}
async function move(which,abilityId=null){
 if(!fight||s.stage!=='battle'||busy||!['strike','guard','focus','ability'].includes(which))return;
 if(which!=='ability'&&which!=='focus'&&!equipped().includes(which))return;
 const ability=which==='ability'?activeAbilities().find(a=>a.id===abilityId):null;
 if(which==='ability'&&(!ability||fight.focus<ability.focus))return;
 busy=true;const before=JSON.parse(JSON.stringify(fight));fight.pending=before;save();updateBattle();
 const p=get();let msg='';
 try{
  if(which==='strike'){
   const hit=baseAttack()+Math.floor(Math.random()*4),label=p.id==='ember'?'Glutstoß':p.id==='tide'?'Wasserstoß':'Rankenstoß';
   msg=`${p.name}: ${label} trifft für ${hit} Schaden.`;
   await fx.action('player',p.id,label,async()=>{fight.focus=Math.min(4,fight.focus+1);const dealt=Enemies.damage(fight,hit);msg=`${p.name}: ${label} trifft für ${dealt.hit} Schaden${dealt.blocked?` (${dealt.blocked} vom Panzer abgefangen)`:''}.`;fight.log=msg;updateBattle();await fx.hit('opponent',dealt.hit,dealt.blocked);});
  }else if(which==='guard'){
   fight.focus=Math.min(4,fight.focus+1);const shield=baseGuard();msg=`${p.name} baut ${shield} Schild auf.`;
   await fx.action('player','guard','Schützen',async()=>{fight.shield+=shield;fight.log=msg;updateBattle();await fx.number('player','+'+shield+' Schild','block');});
  }else if(which==='focus'){
   const gained=Math.min(2,4-fight.focus);msg=`${p.name} sammelt ${gained} Fokus.`;
   await fx.action('player','focus','Beobachten',async()=>{fight.focus+=gained;fight.log=msg;updateBattle();await fx.number('player','+'+gained+' Fokus','block');});
  }else{
   fight.focus-=ability.focus;const type=ability.type,power=ability.power;msg=`${p.name} wirkt ${ability.name}.`;
   await fx.action('player',['shield','wall','summon'].includes(type)?'guard':type==='heal'?'heal':p.id,ability.name,async()=>{
    if(['damage','dot','weaken'].includes(type)){const dealt=Enemies.damage(fight,power);if(type==='dot')fight.dot={name:p.id==='moss'?'Gift':'Brand',power:ability.tick,turns:ability.turns};if(type==='weaken')fight.weaken=ability.turns;msg+=` ${dealt.hit} Schaden${dealt.blocked?` (${dealt.blocked} abgefangen)`:''}.`;fight.log=msg;updateBattle();await fx.hit('opponent',dealt.hit,dealt.blocked);}
    else if(['shield','wall'].includes(type)){fight.shield+=power;if(type==='wall')fight.reflect=4;fight.log=msg;updateBattle();await fx.number('player','+'+power+' Schild','block');}
    else if(type==='heal'){const heal=Math.min(fight.maxHp-fight.hp,power);fight.hp+=heal;fight.log=msg;updateBattle();await fx.number('player','+'+heal+' LP','heal');}
    else if(type==='summon'){fight.summon={name:ability.name,power,turns:ability.turns};fight.log=msg;updateBattle();await fx.number('player',ability.name,'heal');}
   });
  }
  // Summons and ongoing damage resolve before the enemy turn, including their first round.
  for(const type of ['summon','dot']){
   if(fight.enemy<=0)break;const effect=fight[type];if(!effect)continue;
   fx.callout(`${effect.name} wirkt!`);await fx.particles(p.id,'player','opponent',400);const dealt=Enemies.damage(fight,effect.power);effect.turns--;msg+=` ${effect.name}: ${dealt.hit} Schaden.`;if(effect.turns<=0)fight[type]=null;fight.log=msg;updateBattle();await fx.hit('opponent',dealt.hit,dealt.blocked);
  }
  if(fight.enemy<=0){fx.actor('opponent').classList.add('fainted');fx.callout(`${enemyName()} gibt nach.`);await fx.wait(650);endFight(true);return;}
  await fx.wait(200);
  if(fight.playerPoison){fight.playerPoison--;fight.hp=Math.max(0,fight.hp-2);msg+=' Gift: 2 Schaden.';fight.log=msg;updateBattle();await fx.particles('poison','player','player',350);await fx.hit('player',2);}
  if(fight.hp<=0){endFight(false);return;}
  const enemyMove=Enemies.intent(fight),raw=enemyMove.power?enemyMove.power+Math.floor(Math.random()*3)+(fight.attackBonus||0):0,hit=Math.max(0,raw-(fight.weaken?3:0)),blocked=Math.min(hit,fight.shield),damage=hit-blocked;
  if(fight.weaken)fight.weaken--;
  await fx.action('opponent',enemyMove.effect,`${enemyName()}: ${enemyMove.name}`,async()=>{
   let effect='';
   if(enemyMove.shield){fight.enemyShield=Math.min(18,(fight.enemyShield||0)+enemyMove.shield);effect=`Schild +${enemyMove.shield}`;await fx.number('opponent','+'+enemyMove.shield+' Schild','block');}
   else if(enemyMove.heal){const heal=Math.min(enemyMove.heal,fight.maxEnemy-fight.enemy);fight.enemy+=heal;effect=`Heilung +${heal}`;await fx.number('opponent','+'+heal+' LP','heal');}
   else if(enemyMove.power){fight.shield-=blocked;fight.blocked+=blocked;fight.hp=Math.max(0,fight.hp-damage);effect=`${damage} Schaden${blocked?` (${blocked} abgefangen)`:''}`;if(damage&&enemyMove.poison){fight.playerPoison=enemyMove.poison;effect+=' · vergiftet';}if(damage&&enemyMove.drain){const drain=Math.min(fight.focus,enemyMove.drain);fight.focus-=drain;effect+=` · ${drain} Fokus verloren`;}await fx.hit('player',damage,blocked);}
   else effect='Der nächste Angriff wird vorbereitet';
   fight.log=`${msg} ${enemyName()}: ${enemyMove.name} – ${effect}.`;updateBattle();
  });
  if(fight.hp<=0){fx.actor('player').classList.add('fainted');fx.callout('Ihr zieht euch gemeinsam zurück.');await fx.wait(650);endFight(false);return;}
  if(fight.reflect&&enemyMove.power){const reflected=fight.reflect;fight.reflect=0;const dealt=Enemies.damage(fight,reflected);fight.log+=` Die Schutzwand wirft ${dealt.hit} Schaden zurück.`;updateBattle();await fx.hit('opponent',dealt.hit,dealt.blocked);if(fight.enemy<=0){endFight(true);return;}}
  fight.turn++;busy=false;delete fight.pending;save();updateBattle();fx.callout(`${p.name} wartet auf deinen Zug.`);
 }catch(error){console.error('Battle action interrupted',error);fight=before;busy=false;fight.log='Der Zug wurde unterbrochen. Wähle ihn noch einmal.';save();render();}
}
app.addEventListener('click',e=>{
 const btn=e.target.closest('button[data-action]');if(!btn||btn.disabled||busy)return;const a=btn.dataset.action;
 if(s.stage==='battle'&&!['strike','guard','focus','ability','retreat'].includes(a))return;
 if(a==='prolog-start'&&s.stage==='prolog-intro'){prologEnemyToken++;prologEnemyBusy=false;busy=false;s.prolog.battle=Prolog.freshBattle();s.stage='prolog-battle';save();render();}
 else if(a==='prolog-select'&&s.stage==='prolog-battle'){Prolog.select(s.prolog.battle,btn.dataset.id);save();render();}
 else if(a==='prolog-mode'&&s.stage==='prolog-battle'){const r=Prolog.setMode(s.prolog.battle,btn.dataset.mode);if(r?.message)s.prolog.battle.message=r.message;if(s.prolog.battle.result)s.stage='prolog-result';save();render();}
 else if(a==='prolog-tile'&&s.stage==='prolog-battle'){const r=Prolog.tile(s.prolog.battle,+btn.dataset.x,+btn.dataset.y);if(r?.message)s.prolog.battle.message=r.message;if(s.prolog.battle.result)s.stage='prolog-result';save();render();}
 else if(a==='prolog-wait'&&s.stage==='prolog-battle'){const r=Prolog.wait(s.prolog.battle,s.prolog.battle.selected);if(r?.message)s.prolog.battle.message=r.message;if(s.prolog.battle.result)s.stage='prolog-result';save();render();}
 else if(a==='prolog-retry'&&s.stage==='prolog-result'){prologEnemyToken++;prologEnemyBusy=false;busy=false;s.prolog.battle=Prolog.retry();s.stage='prolog-battle';save();render();}
 else if(a==='prolog-after'&&s.stage==='prolog-result'&&s.prolog.battle?.result==='won'){s.stage='prolog-after';save();render();}
 else if(a==='prolog-continue'&&s.stage==='prolog-after'){prologEnemyToken++;prologEnemyBusy=false;busy=false;s.prolog.completed=true;s.prolog.battle=null;if(s.prologReplay){s.prologReplay=false;s.stage=s.chosen?'pet':s.player.avatarCreated?'choose':'avatar';}else s.stage=s.player.avatarCreated?'choose':'avatar';save();render();}
 else if(a==='next-intro'||a==='start'){s.intro++;if(s.intro>=3){s.stage=s.replaying?'world':s.player.avatarCreated?'choose':s.prolog.completed?'avatar':'prolog-intro';s.replaying=false;}save();render();}
 else if(a==='avatar-back'&&s.stage==='avatar'){s.stage='intro';s.intro=2;render();}
 else if(a==='age-band'&&['avatar','knowledge'].includes(s.stage)){if(!P.ageBands[btn.dataset.id])return;s.player.ageBand=btn.dataset.id;s.knowledge=P.normalizeKnowledge(s.knowledge,s.player.ageBand,s.skills);save();render();}
 else if(a==='avatar-random'&&['avatar','wardrobe'].includes(s.stage)){avatarDraft=AvatarEditor.randomize(avatarDraft,s.player.wardrobe);render();}
 else if(a==='avatar-select'&&['avatar','wardrobe'].includes(s.stage)){const field=btn.dataset.field,value=+btn.dataset.value;if(!['face','hair','hairColor','top','pants'].includes(field)||!Number.isInteger(value))return;if(field==='top'&&!s.player.wardrobe.tops.includes(value))return;if(field==='pants'&&!s.player.wardrobe.pants.includes(value))return;avatarDraft=Avatar.normalize({...avatarDraft,[field]:value});render();}
 else if(a==='avatar-confirm'&&s.stage==='avatar'){if(!s.player.ageBand)return;s.player.avatar=Avatar.normalize(avatarDraft);s.player.avatarCreated=true;s.stage='choose';save();render();}
 else if(a==='wardrobe-open'&&s.chosen&&s.stage!=='battle'){s.wardrobeOrigin=s.stage==='wardrobe'?'world':s.stage;avatarDraft={...s.player.avatar};s.stage='wardrobe';save();render();}
 else if(a==='wardrobe-cancel'&&s.stage==='wardrobe'){avatarDraft={...s.player.avatar};s.stage=s.wardrobeOrigin||'world';save();render();}
 else if(a==='wardrobe-save'&&s.stage==='wardrobe'){s.player.avatar=Avatar.normalize(avatarDraft);s.stage=s.wardrobeOrigin||'world';notice='Dein Look wurde gespeichert.';save();render();}
 else if(a==='select'){if(species.some(p=>p.id===btn.dataset.id))selected=btn.dataset.id;render();}
 else if(a==='choose'){s.chosen=selected;s.player.activeCompanion=selected;pet();save();newFight(true);}
 else if(['strike','guard','focus'].includes(a))void move(a);
 else if(a==='ability')void move('ability',btn.dataset.id);
 else if(a==='world'||a==='hub'){if(s.stage==='result'){s.world.zone=fight.won&&!fight.first?(fight.zone||'village'):'village';}s.stage='world';notice='';save();render();}
 else if(a==='return-village'){s.world.zone='village';s.stage='world';Story.resetTravel(s.story);notice='';save();render();}
 else if(a==='journal'){s.stage='journal';save();render();}
 else if(a==='comic-continue'&&s.stage==='interlude'){s.story.seenComics[areaChapter().id]=true;s.stage='world';save();render();}
 else if(a==='journey-continue'){visitRegion(Story.current(s.story).zone);notice=Story.current(s.story).intro;save();render();}
 else if(a==='chapter-gate')chapterGate();
 else if(a==='teacher-about'){s.teacherAbout=true;render();}
 else if(a==='guide-gift'&&s.dialog?.type==='guide'){
  const reward=s.story.claimed.welcome?0:3,first=!s.story.claimed.welcome;s.story.claimed.welcome=true;s.points+=reward;const outfitUnlocked=first&&unlockClothing('top',1,'Enos Willkommensausstattung');s.dialog.step='reply';s.dialog.result={response:'Besuche Alwin, Mira und Tara in ihren Häusern. Sag ihnen einfach, dass ihr gemeinsam lernen möchtet. Diese Wissenspunkte sollen euch den Anfang erleichtern. Für den Weg habe ich außerdem etwas Praktisches für dich.',reward,outfitUnlocked,outfitName:Avatar.topNames[1]};save();render();
 }
 else if(a==='resident-choice'&&s.dialog?.type==='resident'&&s.dialog.step==='ask'){
  const result=Story.choose(s.story,s.dialog.chapter,+btn.dataset.index);if(!result)return;
  s.points+=result.reward;if(result.gift)care().bond=Math.min(100,care().bond+1);s.dialog.step='reply';s.dialog.result=result;save();render();
 }
 else if(a==='resident-retry'&&s.dialog?.type==='resident'){s.dialog.step='ask';save();render();}
 else if(a==='traveler-choice'&&s.dialog?.type==='traveler'&&s.dialog.step==='ask'){
  const id=s.dialog.chapter,reward=s.story.randomSeen[id]?0:2;s.story.randomSeen[id]=true;s.points+=reward;s.dialog.step='reply';s.dialog.result={response:+btn.dataset.index===0?'Danke. Schon dass jemand kurz bleibt, hilft mir. Jetzt kann ich wieder klarer denken.':'Das ist freundlich. Du beschreibst den Weg zurück nach Lichtquell. Die Reisende merkt sich die nächsten Wegzeichen.',reward};save();render();
 }
 else if(a==='peaceful'&&s.stage==='encounter'){
  const c=areaChapter();if(!s.story.trust[c.id]||s.story.resolved[c.id])return;
  Story.resolve(s.story,c.id,'peaceful');s.points+=2;Story.resetTravel(s.story);s.dialog={type:'chapter-end',chapter:c.id,step:'reply',result:{response:c.calm+' '+c.ending,reward:2}};s.stage='dialog';save();render();
 }
 else if(a==='pet-view'||a==='pet'){s.stage='pet';notice='';save();render();}
 else if(a==='knowledge'){s.stage='knowledge';notice='';save();render();}
 else if(a==='knowledge-start'&&P.domains[btn.dataset.kind]){trainingKind=btn.dataset.kind;trainingAttribute=P.defaultAttribute(trainingKind,pet());task=s.lessons[get().id+':'+trainingKind]||null;s.teacherAbout=false;s.stage='task';save();render();}
 else if(a==='training-attribute'&&s.stage==='task'){const id=btn.dataset.id;if(!P.validTrainingAttributes(trainingKind).includes(id))return;trainingAttribute=id;if(task&&!task.complete&&task.status==='open')task.attributeId=id;save();render();}
 else if(a==='skills'){s.skillOrigin=s.stage==='dialog'&&s.dialog?.type==='skills'?'house':'camp';s.stage='skills';selectedSlot=Math.max(0,P.prepareSets(pet(),get().id).indexOf(null));notice='';save();render();}
 else if(a==='select-set'&&s.stage==='skills'){const i=+btn.dataset.index;if(!Number.isInteger(i)||i<0||i>2)return;pet().activeSet=i;selectedSlot=0;notice='Set '+(i+1)+' ist für den nächsten Kampf aktiv.';save();render();}
 else if(a==='select-slot'&&s.stage==='skills'){const i=+btn.dataset.index;if(!Number.isInteger(i)||i<0||i>3)return;selectedSlot=i;render();}
 else if(['equip','unequip'].includes(a)&&s.stage==='skills'){if(P.equip(pet(),get().id,selectedSlot,a==='unequip'?null:btn.dataset.id)){notice='Kampfset gespeichert.';save();render();}}
 else if(a==='unlock'&&s.stage==='skills'){const success=P.unlock(pet(),get().id,btn.dataset.id);notice=success?'Dauerhaft gelernt. Lege die Fähigkeit auf einen der vier Plätze, um sie im nächsten Kampf einzusetzen.':'Dafür fehlen Fähigkeitspunkte oder eine vorherige Fähigkeit.';save();render();}
 else if(a==='replay-prolog'){s.prologReplay=true;s.prolog.battle=null;s.stage='prolog-intro';save();render();}
 else if(a==='replay-intro'){s.replaying=true;s.intro=0;s.stage='intro';save();render();}
 else if(a==='new-battle')newFight(false,s.stage==='encounter'?{kind:'boss',chapter:areaChapter().id,zone:s.world.zone}:null);
 else if(a==='retreat'){s.world.zone=fight?.zone&&fight.zone!=='village'?fight.zone:'forest';fight=null;s.stage='world';Story.resetTravel(s.story);notice='Ihr zieht euch in Ruhe zurück. Für einen abgebrochenen Kampf gibt es keine Wissenspunkte.';save();render();}
 else if(['praise','cuddle'].includes(a))contact(a);
 else if(a==='pick-task'){s.stage='task';save();render();}
 else if(a==='begin-task'||a==='next-task'){
  if(s.points<1||(task&&!task.complete))return;
  trainingKind=P.domains[btn.dataset.kind]?btn.dataset.kind:trainingKind;
  if(!P.domains[trainingKind])return;
  trainingAttribute=P.validTrainingAttributes(trainingKind).includes(trainingAttribute)?trainingAttribute:P.defaultAttribute(trainingKind,pet());
  s.points--;task=P.generate(trainingKind,s.knowledge,s.player.ageBand);task.petId=get().id;task.attributeId=trainingAttribute;notice='';bondLine='';bondDelta=null;careMood='';s.stage='task';save();render();
 }else if(a==='similar-task'){
  if(!task||task.status!=='wrong')return;const previous=task.prompt,attributeId=task.attributeId||trainingAttribute;task=P.generate(task.kind,s.knowledge,s.player.ageBand,previous);task.petId=get().id;task.attributeId=attributeId;task.remedial=true;notice='Neue, ähnliche Aufgabe zum selben Lernziel. Wenn du sie selbst löst, zählt sie ganz normal für Wissen und Wesenentwicklung.';save();render();
 }else if(a==='answer'){
  if(!task||task.complete||task.status!=='open'||task.petId&&task.petId!==get().id)return;const index=+btn.dataset.index,value=task.options[index];
  if(value===task.answer){const result=P.awardLearning(pet(),s.knowledge,task.kind,task.attributeId||trainingAttribute,task.topicId);task.complete=true;task.status='correct';task.correctIndex=index;task.earned=result.skillPoints;task.attributeAward=result.attribute;recordContext('training',{kind:task.kind});notice='';bondLine='';bondDelta=null;careMood='';save();render();}
  else{task.attempts=1;task.status='wrong';task.wrongIndex=index;task.correctIndex=task.options.indexOf(task.answer);P.recordWrong(s.knowledge,task.kind,task.topicId);notice='Die Aufgabe ist beendet. Schau dir Lösung und Erklärung an – danach bekommst du eine neue, ähnliche Aufgabe.';save();render();}
 }
});
const mc=document.modelContext;
if(mc?.registerTool){
 const register=tool=>{try{Promise.resolve(mc.registerTool(tool)).catch(()=>{})}catch{}};
 register({name:'read_game_status',title:'Spielstand lesen',description:'Liest Spielabschnitt, Starter, Punkte, Erfahrung und Bindung.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({schemaVersion:s.schemaVersion,stage:s.stage,prologCompleted:!!s.prolog.completed,prolog:s.prolog.battle?Prolog.status(s.prolog.battle):null,starter:s.chosen,avatarCreated:s.player.avatarCreated,activeCompanion:s.player.activeCompanion,avatar:s.player.avatar,wardrobe:Wardrobe.count(s.player.wardrobe),ageBand:s.player.ageBand,knowledge:Object.fromEntries(Object.entries(s.knowledge.domains).map(([id,d])=>[id,{correct:d.correct,wrong:d.wrong,level:d.level}])),points:s.points,xp:s.xp,wins:s.wins,losses:s.losses,bond:s.chosen?care().bond:0,skillPoints:s.chosen?pet().skillPoints:0,attributes:s.chosen?Object.fromEntries(P.attributeDefs.map(d=>[d.id,pet().attributes[d.id]])):null,unlocked:s.chosen?pet().unlocked:[],zone:s.world.zone,busy})});
 register({name:'choose_starter',title:'Startwesen wählen',description:'Wählt im Auswahlbildschirm ein Startwesen.',inputSchema:{type:'object',properties:{id:{type:'string',enum:['moss','ember','tide']}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false},execute:({id})=>{if(s.stage!=='choose'||!species.some(x=>x.id===id))throw Error('Starterauswahl ist nicht verfügbar.');selected=id;s.chosen=id;s.player.activeCompanion=id;pet();newFight(true);return{stage:s.stage,starter:id};}});
 register({name:'play_battle_turn',title:'Kampfzug spielen',description:'Spielt einen vollständigen Zug mit Gegenangriff und Animation.',inputSchema:{type:'object',properties:{move:{type:'string',enum:['strike','guard','focus','ability']},abilityId:{type:'string'}},required:['move'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async({move:action,abilityId})=>{if(s.stage!=='battle'||busy||!['strike','guard','focus','ability'].includes(action))throw Error('Kampfzug nicht verfügbar.');if(action==='ability'){const a=known().find(x=>x.id===abilityId);if(!a||!equipped().includes(abilityId)||fight.focus<a.focus)throw Error('Fähigkeit nicht verfügbar.');}else if(action!=='focus'&&!equipped().includes(action))throw Error('Aktion nicht im Kampfset.');await move(action,abilityId);return{stage:s.stage,ownHp:fight.hp,enemyHp:fight.enemy,focus:fight.focus,log:fight.log};}});
}
save();render();
})();
