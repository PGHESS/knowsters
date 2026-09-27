/* Free-plane movement: normalized keyboard, touch joystick and direct destinations. */
(()=>{'use strict';
const maps={
 village:{name:'Lichtquell',subtitle:'Stadt zwischen Wissen und Wandel',image:'assets/village-map.webp',spawn:[48,56],
  nodes:[[5,56],[22,56],[21.7,39],[48,56],[48,24],[73,56],[73,40],[83,59],[94,65],[48,85],[54,85],[25,56],[25,66]],
  edges:[[0,1],[1,11],[11,3],[1,2],[3,4],[3,5],[5,6],[5,7],[7,8],[3,9],[9,10],[11,12]],
  places:[{id:'math',name:'Rechenwerkstatt',short:'Mathe',icon:'＋',x:21.7,y:39,node:2},{id:'language',name:'Bibliothek',short:'Deutsch',icon:'Aa',x:48,y:24,node:4},{id:'logic',name:'Denkturm',short:'Logik',icon:'◇',x:73,y:40,node:6},{id:'rest',name:'Dein Quartier',short:'Quartier',icon:'♡',x:25,y:66,node:12},{id:'skills',name:'Haus der Talente',short:'Talente',icon:'✦',x:54,y:85,node:10},{id:'forest',name:'Zum Stadtrand und Flüsterwald',short:'Stadtrand',icon:'↗',x:94,y:65,node:8}]},
 forest:{name:'Flüsterwald',subtitle:'Hinter dem Stadtrand',image:'assets/forest-map.webp',spawn:[8,60.5],
  nodes:[[2,60],[15,61],[29,60],[40,55],[44,47],[50,45],[64,45],[72,39],[76,33],[79,27],[45,61],[49,72],[54,77],[59,79]],
  edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[3,10],[10,11],[11,12],[12,13]],
  places:[{id:'village',name:'Zurück nach Lichtquell',short:'Stadt',icon:'↙',x:2,y:60,node:0},{id:'encounter',name:'Die alte Ruine',short:'Nebelrufer',icon:'⚔',x:79,y:27,node:9},{id:'spring',name:'Stille Quelle',short:'Quelle',icon:'◌',x:59,y:79,node:13}]}
};
maps.village.places.push({id:'guide',name:'Eno am Lichtquell-Forum',short:'Eno',icon:'…',portrait:'guide',x:48,y:56,node:3});
maps.forest.places=maps.forest.places.filter(p=>p.id!=='spring');
maps.forest.places.push({id:'resident',name:'Nela an der Quelle',short:'Nela',icon:'…',portrait:'herbalist',x:59,y:79,node:13});
for(const [i,zone] of ['canyon','lake','pass','sanctuary'].entries()){
 const info=window.KnowstersStory.chapters[i+1],npc=window.KnowstersStory.residents[info.npc];
 maps[zone]={name:info.place,subtitle:`Kapitel ${info.id} · ${info.title}`,image:'assets/chapter-maps.webp',atlas:[i%2,Math.floor(i/2)],spawn:[5,65],
  nodes:[[4,65],[22,65],[40,55],[52,45],[65,40],[78,28],[48,70],[60,80]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[2,6],[6,7]],
 places:[{id:'village',name:'Zurück nach Lichtquell',short:'Stadt',icon:'↙',x:4,y:65,node:0},{id:'encounter',name:info.boss,short:'Begegnung',icon:'⚔',x:78,y:28,node:5},{id:'resident',name:npc.name,short:npc.name,icon:'…',portrait:info.npc,x:60,y:80,node:7}]};
}
// These centerlines follow the inspected painted roads, bridges and clearings.
const routes={
 canyon:{nodes:[[4,65],[20,64],[32,53],[43,45],[55,44],[61,51],[76,43],[82,33],[82,27],[68,61],[68,75],[76,80]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11]],boss:8,npc:11},
 lake:{nodes:[[4,65],[24,63],[34,51],[45,49],[57,47],[72,44],[79,36],[80,28],[59,64],[66,75],[75,81]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[4,8],[8,9],[9,10]],boss:7,npc:10},
 pass:{nodes:[[4,72],[21,70],[32,59],[43,49],[55,48],[62,51],[76,44],[82,36],[82,32],[69,65],[69,79],[81,81]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11]],boss:8,npc:11},
 sanctuary:{nodes:[[4,74],[21,72],[34,61],[48,49],[57,47],[71,46],[80,38],[80,33]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]],boss:7,npc:4}
};
for(const [zone,r] of Object.entries(routes)){const map=maps[zone];map.nodes=r.nodes;map.edges=r.edges;map.spawn=[...r.nodes[0]];for(const p of map.places){p.node=p.id==='village'?0:p.id==='encounter'?r.boss:r.npc;[p.x,p.y]=r.nodes[p.node];}}
for(const [zone,map] of Object.entries(maps))map.zone=zone;
const terrain=window.KnowstersTerrain;
for(const map of Object.values(maps))for(const p of map.places)if(!terrain.walkable(map,[p.x,p.y]))[p.x,p.y]=terrain.safe(map,[p.x,p.y]);
const distance=(a,b)=>Math.hypot((a[0]-b[0])*1.5,a[1]-b[1]);
function project(point,a,b){const dx=(b[0]-a[0])*1.5,dy=b[1]-a[1],px=(point[0]-a[0])*1.5,py=point[1]-a[1];const t=Math.max(0,Math.min(1,(px*dx+py*dy)/(dx*dx+dy*dy)));return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}
function nearest(map,p){let best=null;map.edges.forEach((edge,i)=>{const point=project(p,map.nodes[edge[0]],map.nodes[edge[1]]),d=distance(point,p);if(!best||d<best.d)best={point,edge,index:i,d};});return best;}
const clampPoint=p=>[Math.max(1.5,Math.min(98.5,Number(p?.[0])||1.5)),Math.max(5,Math.min(96,Number(p?.[1])||5))];
function route(map,from,to){return terrain.route(map,from,to);}
const keyDirection=key=>({ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'}[key]||{w:'up',s:'down',a:'left',d:'right'}[key?.toLowerCase()]);
class World{
 constructor(container,options){
  this.container=container;this.o=options;this.map=maps[options.zone]||maps.village;this.pos=terrain.safe(this.map,options.position||this.map.spawn);this.path=[];this.targetPlace=null;this.last=0;this.frame=0;this.held=null;this.dead=false;this.keys=new Set();this.pointers=new Map();this.stick=[0,0];this.stickPointer=null;this.lastSave=0;
  const map=this.map;
  const avatar=window.KnowstersAvatar?.normalize(options.avatar||{})||options.avatar||{};
  const avatarMarkup=window.KnowstersAvatar?.markup(avatar,'world-human')||'<span class="human-avatar-sprite world-human" role="img" aria-label="Deine Spielfigur"></span>';
  container.innerHTML=`<div class="world-viewport" tabindex="0" role="group" aria-label="${map.name}. Freie Bewegung mit WASD, Pfeiltasten oder Touch."><div class="world-scene">${map.atlas?`<div class="world-map chapter-map" role="img" aria-label="${map.name}" style="background-position:${map.atlas[0]*100}% ${map.atlas[1]*100}%"></div>`:`<img class="world-map" src="${map.image}" alt="${map.name} mit verbundenen Wegen und besuchbaren Orten" draggable="false">`}${options.zone==='village'?'<img class="talent-house-map" src="assets/talent-house.webp" alt="Haus der Talente" draggable="false">':''}${map.places.map(p=>`<button class="world-place ${p.portrait?'world-person':''}" data-place="${p.id}" style="left:${p.x}%;top:${p.y}%" aria-label="Zu ${p.name} laufen">${p.portrait?window.KnowstersNarrative.portrait(p.portrait):`<span>${p.icon}</span>`}<span class="place-caption">${p.short}${p.portrait?' …':''}</span></button>`).join('')}<div class="world-companion battle-actor" data-id="${options.pet}" aria-label="${options.petName||'Dein Begleiter'} folgt dir"><div class="companion-facing"><div class="combat-sprite" data-pose="idle"></div></div><span class="avatar-shadow"></span></div><div class="world-avatar" aria-label="Deine menschliche Spielfigur"><div class="human-facing">${avatarMarkup}</div><span class="avatar-shadow"></span></div><div class="walk-target" hidden></div></div><div class="area-label"><strong>${map.name}</strong><small>${map.subtitle}</small></div><span class="walk-tip">Du führst die Gruppe · WASD / Pfeiltasten · Ziel antippen</span></div><div class="world-controls"><div class="touch-joystick" role="group" aria-label="Freier Steuerknüppel. Ziehen zum Laufen."><span class="joystick-knob"></span><span class="joystick-label">Bewegen</span></div><div class="dpad" aria-label="Bewegung"><button data-dir="up" aria-label="Nach oben">↑</button><button data-dir="left" aria-label="Nach links">←</button><button data-dir="down" aria-label="Nach unten">↓</button><button data-dir="right" aria-label="Nach rechts">→</button></div><div class="world-context" aria-live="polite"><span>Erkunde die Umgebung mit deinem Begleiter.</span><button class="primary interact" hidden>Betreten</button></div></div>`;
  this.viewport=container.querySelector('.world-viewport');this.scene=container.querySelector('.world-scene');this.avatar=container.querySelector('.world-avatar');this.humanFacing=this.avatar.querySelector('.human-facing');this.companion=container.querySelector('.world-companion');this.companionFacing=this.companion.querySelector('.companion-facing');this.marker=container.querySelector('.walk-target');this.context=container.querySelector('.world-context span');this.interact=container.querySelector('.interact');this.facing=1;this.companionPos=[this.pos[0]-3.2,this.pos[1]+2.2];
  this.onClick=e=>{const place=e.target.closest('[data-place]');if(place){const p=map.places.find(x=>x.id===place.dataset.place);this.go([p.x,p.y],p);return;}if(e.target.closest('.interact')){if(this.near)this.o.onEnter(this.near.id);return;}if(!e.target.closest('.world-viewport'))return;const rect=this.scene.getBoundingClientRect();this.go([(e.clientX-rect.left)/rect.width*100,(e.clientY-rect.top)/rect.height*100]);};
  this.joystick=container.querySelector('.touch-joystick');this.knob=container.querySelector('.joystick-knob');
  this.cancelRoute=()=>{this.path=[];this.targetPlace=null;this.marker.hidden=true;};
  this.updateStick=e=>{const r=this.joystick.getBoundingClientRect(),radius=r.width*.35,dx=(e.clientX-r.left-r.width/2)/radius,dy=(e.clientY-r.top-r.height/2)/radius,len=Math.hypot(dx,dy);this.stick=len<.12?[0,0]:[dx/Math.max(1,len),dy/Math.max(1,len)];this.knob.style.transform=`translate(${this.stick[0]*radius}px,${this.stick[1]*radius}px)`;};
  this.onDown=e=>{const btn=e.target.closest('[data-dir]'),stick=e.target.closest('.touch-joystick');if(!btn&&!stick)return;e.preventDefault();this.cancelRoute();if(stick){if(this.stickPointer!==null)return;this.stickPointer=e.pointerId;this.updateStick(e);stick.setPointerCapture?.(e.pointerId);}else{this.pointers.set(e.pointerId,btn.dataset.dir);btn.setPointerCapture?.(e.pointerId);}};
  this.onPointerMove=e=>{if(e.pointerId!==this.stickPointer)return;e.preventDefault();this.updateStick(e);};
  this.onUp=e=>{this.pointers.delete(e?.pointerId);if(e?.pointerId===this.stickPointer){this.stickPointer=null;this.stick=[0,0];this.knob.style.transform='translate(0,0)';}this.o.onSave([...this.pos]);};
  this.onKey=e=>{if(this.dead||e.altKey||e.ctrlKey||e.metaKey||e.target?.closest('input,textarea,select,[contenteditable="true"]'))return;const dir=keyDirection(e.key);if(dir){e.preventDefault();this.cancelRoute();this.keys.add(e.key);}else if((e.key==='Enter'||e.key==='e'||e.key==='E')&&!e.target?.closest('button')){e.preventDefault();if(this.near)this.o.onEnter(this.near.id);}};
  this.onKeyUp=e=>{this.keys.delete(e.key);this.o.onSave([...this.pos]);};
  this.onBlur=()=>{this.keys.clear();this.pointers.clear();this.stick=[0,0];this.stickPointer=null;this.knob.style.transform='translate(0,0)';this.cancelRoute();this.last=0;this.o.onSave([...this.pos]);};
  this.onVisibility=()=>{if(document.hidden)this.onBlur();};
  this.events=[['click',this.onClick],['pointerdown',this.onDown],['pointermove',this.onPointerMove],['pointerup',this.onUp],['pointercancel',this.onUp],['lostpointercapture',this.onUp]];
  for(const [event,fn] of this.events)container.addEventListener(event,fn);window.addEventListener('keydown',this.onKey);window.addEventListener('keyup',this.onKeyUp);window.addEventListener('blur',this.onBlur);document.addEventListener?.('visibilitychange',this.onVisibility);
  this.resize=()=>{const r=this.viewport.getBoundingClientRect();this.w=Math.max(r.width,r.height*1.5);this.h=this.w/1.5;this.vw=r.width;this.vh=r.height;this.scene.style.width=this.w+'px';this.scene.style.height=this.h+'px';this.paint();};
  if(window.ResizeObserver){this.observer=new ResizeObserver(this.resize);this.observer.observe(this.viewport);}this.resize();this.updateNear();this.o.onSave([...this.pos]);this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick);
 }
 go(point,place=null){this.keys.clear();this.pointers.clear();this.stick=[0,0];this.knob.style.transform='translate(0,0)';const dest=terrain.safe(this.map,point);this.path=route(this.map,this.pos,dest).slice(1).filter(p=>distance(this.pos,p)>.05);this.targetPlace=place;this.marker.hidden=false;this.marker.style.left=dest[0]+'%';this.marker.style.top=dest[1]+'%';if(!this.path.length)this.arrive();}
 direction(dir){const v={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];if(v)this.go([this.pos[0]+v[0]*8/1.5,this.pos[1]+v[1]*8]);}
 inputVector(){const dirs=new Set([...this.keys].map(keyDirection).concat([...this.pointers.values()]));let x=(dirs.has('right')?1:0)-(dirs.has('left')?1:0)+this.stick[0],y=(dirs.has('down')?1:0)-(dirs.has('up')?1:0)+this.stick[1],len=Math.hypot(x,y);return[x/Math.max(1,len),y/Math.max(1,len)];}
 tick(time){if(this.dead)return;const previous=[...this.pos],dt=Math.min(.045,this.last?(time-this.last)/1000:0);this.last=time;const [vx,vy]=this.inputVector();
  if(vx||vy){this.pos=terrain.move(this.map,this.pos,[this.pos[0]+vx*dt*24/1.5,this.pos[1]+vy*dt*24]);}
  else if(this.path.length){const p=this.path[0],d=distance(this.pos,p),step=dt*24;if(d<=step&&terrain.clear(this.map,this.pos,p)){this.pos=[...p];this.path.shift();if(!this.path.length)this.arrive();}else{this.pos=terrain.move(this.map,this.pos,[this.pos[0]+(p[0]-this.pos[0])*Math.min(step,d)/d,this.pos[1]+(p[1]-this.pos[1])*Math.min(step,d)/d],false);if(distance(previous,this.pos)<.0001&&dt>0)this.cancelRoute();}}
  if(this.dead)return;
  const moved=distance(previous,this.pos),walking=moved>.001;
  this.avatar.classList.toggle('walking',walking);this.companion.classList.toggle('walking',walking);this.companion.querySelector('.combat-sprite').dataset.pose=walking&&Math.floor(time/180)%2?'charge':'idle';
  if(Math.abs(this.pos[0]-previous[0])>.001){this.facing=this.pos[0]<previous[0]?-1:1;this.humanFacing.style.transform=this.facing<0?'scaleX(-1)':'scaleX(1)';this.companionFacing.style.transform=this.facing<0?'scaleX(-1)':'scaleX(1)';}
  const followTarget=[this.pos[0]-this.facing*3.2,this.pos[1]+2.2],followSpeed=Math.min(1,dt*7);this.companionPos=[this.companionPos[0]+(followTarget[0]-this.companionPos[0])*followSpeed,this.companionPos[1]+(followTarget[1]-this.companionPos[1])*followSpeed];
  this.paint();this.updateNear();
  if(walking){this.o.onTravel?.(moved,[...this.pos]);if(!this.dead&&time-this.lastSave>600){this.lastSave=time;this.o.onSave([...this.pos]);}}
  if(!this.dead)this.frame=requestAnimationFrame(this.tick);
 }
 arrive(){this.marker.hidden=true;this.o.onSave([...this.pos]);this.updateNear();if(this.targetPlace){const p=this.targetPlace;this.targetPlace=null;if(distance(this.pos,[p.x,p.y])<4&&terrain.clear(this.map,this.pos,[p.x,p.y]))this.o.onEnter(p.id);}}
 updateNear(){const p=this.map.places.find(p=>distance(this.pos,[p.x,p.y])<4&&terrain.clear(this.map,this.pos,[p.x,p.y]));this.near=p||null;this.context.textContent=p?p.name:(this.path.length?'Unterwegs …':'Erkunde die Umgebung.');this.interact.hidden=!p;if(p)this.interact.textContent=['forest','village'].includes(p.id)?'Weitergehen →':p.id==='encounter'?'Begegnung →':'Besuchen →';}
 paint(){if(!this.w)return;this.avatar.style.left=this.pos[0]+'%';this.avatar.style.top=this.pos[1]+'%';this.companion.style.left=this.companionPos[0]+'%';this.companion.style.top=this.companionPos[1]+'%';const x=Math.max(0,Math.min(this.w-this.vw,this.pos[0]/100*this.w-this.vw/2)),y=Math.max(0,Math.min(this.h-this.vh,this.pos[1]/100*this.h-this.vh/2));this.scene.style.transform=`translate(${-x}px,${-y}px)`;}
 destroy(){this.dead=true;cancelAnimationFrame(this.frame);this.observer?.disconnect();this.o.onSave([...this.pos]);for(const [event,fn] of this.events)this.container.removeEventListener(event,fn);window.removeEventListener('keydown',this.onKey);window.removeEventListener('keyup',this.onKeyUp);window.removeEventListener('blur',this.onBlur);document.removeEventListener?.('visibilitychange',this.onVisibility);}

}
window.KnowstersWorld={maps,route,nearest,clampPoint,distance,World};
})();
