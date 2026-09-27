/* Regional creatures share explicit, readable turn patterns. */
(()=>{'use strict';
const move=(name,effect,power,extra={})=>({name,effect,power,...extra});
const mist=move('Nebelstoß','enemy',7),burst=move('Dunkler Ausbruch','enemy',13);
const creatures={
 mist:{name:'Nebelrufer',type:'Nebel',sprite:-1,hp:35,hint:'Jeder dritte Zug ist ein schwerer Angriff. Bereite deinen Schild vor.',moves:[mist,mist,burst]},
 beetle:{name:'Sporenkäfer',type:'Pflanze',sprite:0,hp:27,hint:'Sporen vergiften nur, wenn sie deinen Schild durchdringen. Gift wirkt zwei Runden.',moves:[move('Fühlerstoß','moss',5),move('Sporenwolke','poison',4,{poison:2}),move('Pilzpanzer','guard',0,{shield:6})]},
 crab:{name:'Bernsteinkrabbe',type:'Stein',sprite:1,hp:32,hint:'Nach dem Panzer kommt der Zangenhieb. Nutze die ruhige Runde für Fokus.',moves:[move('Bernsteinpanzer','guard',0,{shield:7}),move('Zangenhieb','stone',10),move('Kieselschuss','stone',6)]},
 jelly:{name:'Tropfenqualle',type:'Wasser',sprite:2,hp:28,hint:'Die Heilwelle kostet sie einen Angriff. Sammle Fokus für einen kräftigen Gegenstoß.',moves:[move('Wasserperlen','tide',6),move('Heilwelle','heal',0,{heal:5}),move('Flutstoß','tide',10)]},
 owl:{name:'Gewittereule',type:'Wind',sprite:3,hp:29,hint:'Die Eule lädt zuerst Blitze auf. Ihr Donnerflug trifft in Runde drei besonders hart.',moves:[move('Windfeder','wind',5),move('Blitze sammeln','focus',0),move('Donnerflug','storm',15)]},
 fox:{name:'Kristallfuchs',type:'Licht',sprite:4,hp:31,hint:'Sein Lichtschweif raubt einen Fokuspunkt, wenn du den Treffer nicht ganz abfängst.',moves:[move('Kristallsplitter','crystal',7),move('Lichtschweif','crystal',5,{drain:1}),move('Sternensprung','crystal',10)]},
 turtle:{name:'Brückenwächter',type:'Stein',sprite:5,hp:44,hint:'Er baut einen starken Panzer auf, greift danach aber zwei Runden hintereinander an.',moves:[move('Brückenpanzer','guard',0,{shield:10}),move('Felssturz','stone',11),move('Stampfwelle','stone',8)]},
 serpent:{name:'Spiegelschatten',type:'Wasser',sprite:6,hp:46,hint:'Er heilt sich jede dritte Runde. Plane deine Angriffe, statt nur abzuwarten.',moves:[move('Spiegelsplitter','tide',8),move('Tiefensog','tide',6,{drain:1}),move('Seespiegel','heal',0,{heal:7})]},
 griffin:{name:'Sturmwächter',type:'Wind',sprite:7,hp:49,hint:'Nach dem Windmantel folgt der Donnerschlag. Ein Schild hilft gegen den starken Treffer.',moves:[move('Sturmfeder','wind',7),move('Windmantel','guard',0,{shield:8}),move('Donnerschlag','storm',16)]},
 stag:{name:'Hüter des Nebels',type:'Licht',sprite:8,hp:55,hint:'Der Hüter wechselt zwischen Schutz, Licht und Nebel. Achte auf seinen angekündigten Zug.',moves:[move('Erinnerungshülle','guard',0,{shield:8}),move('Geweih des Lichts','crystal',11),move('Nebel des Vergessens','enemy',7,{drain:1}),move('Morgenleuchten','crystal',14)]}
};
const pools={forest:['beetle','mist'],canyon:['crab','beetle'],lake:['jelly','fox'],pass:['owl','crab'],sanctuary:['fox','owl','jelly']};
const bosses=['mist','turtle','serpent','griffin','stag'];
function get(id){return creatures[id]||creatures.mist;}
function pick(zone,kind,chapter,last,rng=Math.random){if(kind!=='random')return kind==='boss'?bosses[chapter-1]||'mist':'mist';const pool=(pools[zone]||pools.forest).filter(id=>id!==last);return pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];}
function intent(fight){const c=get(fight.enemyId);return c.moves[(fight.turn-1)%c.moves.length];}
function damage(fight,power){const blocked=Math.min(fight.enemyShield||0,power);fight.enemyShield=Math.max(0,(fight.enemyShield||0)-blocked);const hit=Math.min(fight.enemy,power-blocked);fight.enemy=Math.max(0,fight.enemy-hit);return{hit,blocked};}
window.KnowstersEnemies={creatures,pools,bosses,get,pick,intent,damage};
})();
