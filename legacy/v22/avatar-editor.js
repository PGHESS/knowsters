/* Knowsters character creator + in-game wardrobe (v17 package). Rendering-only module: persistence and navigation remain controlled by game.js. */
(()=>{'use strict';
const A=window.KnowstersAvatar,P=window.KnowstersProgress,ageBands=P?.ageBands||{'12-13':{label:'12–13 Jahre'},'14-15':{label:'14–15 Jahre'},'16-17':{label:'16–17 Jahre'},'18-24':{label:'18–24 Jahre'},'25-40':{label:'25–40 Jahre'}};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const option=(field,value,selected,content,label,disabled=false)=>`<button type="button" class="avatar-option ${selected?'selected':''} ${disabled?'locked':''}" data-action="avatar-select" data-field="${field}" data-value="${value}" aria-pressed="${selected}" aria-label="${esc(label)}" ${disabled?'disabled aria-disabled="true"':''}>${content}${disabled?'<span class="avatar-lock" aria-hidden="true">⌁</span>':''}</button>`;
const tiny=(avatar,label)=>`<span class="avatar-option-preview">${A.markup(avatar,'editor-mini',label)}</span>`;
function section(title,meta,body){return `<fieldset class="avatar-field"><legend><span>${title}</span><small>${meta}</small></legend>${body}</fieldset>`;}
function markup(raw,wardrobe={tops:[0],pants:[0]},options={}){
 const a=A.normalize(raw),tops=new Set(wardrobe.tops||[0]),pants=new Set(wardrobe.pants||[0]),mode=options.mode==='wardrobe'?'wardrobe':'create';
 const isWardrobe=mode==='wardrobe',ageBand=options.ageBand||null;
 const hairs=A.hairNames.map((name,i)=>option('hair',i,a.hair===i,tiny({...a,hair:i},name),name)).join('');
 const colors=A.hairColors.map((color,i)=>option('hairColor',i,a.hairColor===i,`<span class="hair-swatch" style="--swatch:${color}"></span><small>${esc(A.hairColorNames[i])}</small>`,A.hairColorNames[i])).join('');
 const faces=A.faceNames.map((name,i)=>option('face',i,a.face===i,tiny({...a,face:i,hair:2},name),name)).join('');
 const topsMarkup=A.topNames.map((name,i)=>option('top',i,a.top===i,tiny({...a,top:i},name),`${name}${tops.has(i)?'':' – noch nicht freigeschaltet'}`,!tops.has(i))).join('');
 const pantsMarkup=A.pantsNames.map((name,i)=>option('pants',i,a.pants===i,tiny({...a,pants:i},name),`${name}${pants.has(i)?'':' – noch nicht freigeschaltet'}`,!pants.has(i))).join('');
 const heading=isWardrobe?`<div class="kicker">Dein Stil</div><h1>Charakter & Garderobe</h1><p>Ändere deinen Look jederzeit. Kleidung bleibt kosmetisch und verändert keine Kampfwerte.</p>`:`<div class="kicker">Dein Charakter</div><h1>Wer betritt Lichtquell?</h1><p>Du spielst einen Menschen. Dein ausgewähltes Wesen begleitet dich später sichtbar durch die Welt.</p>`;
 const copy=isWardrobe?`<strong>Dein Look bleibt deine Entscheidung.</strong><span>Neue Kleidung schaltest du durch Begegnungen, Aufgaben und spätere Shops frei. Gesicht und Haare kannst du frei verändern.</span>`:`<strong>Du führst die Gruppe.</strong><span>Ein Wesen folgt dir außerhalb der Kämpfe. Im Kampf tritt später dein Team gemeinsam an.</span>`;
 const ageOptions=!isWardrobe?`<div class="age-band-grid">${Object.entries(ageBands).map(([id,item])=>`<button type="button" class="age-band-option ${ageBand===id?'selected':''}" data-action="age-band" data-id="${id}" aria-pressed="${ageBand===id}"><strong>${esc(item.label)}</strong><small>nur Startniveau</small></button>`).join('')}</div><p class="avatar-field-note">Das Alter dient nur als grobe Startschätzung. Jedes Wissensgebiet passt sich später getrennt an deine Antworten an.</p>`:'';
 const actions=isWardrobe?`<button type="button" class="secondary" data-action="wardrobe-cancel">Abbrechen</button><button type="button" class="secondary" data-action="avatar-random">Zufall</button><button type="button" class="primary" data-action="wardrobe-save">Änderungen übernehmen →</button>`:`<button type="button" class="secondary" data-action="avatar-back">← Prolog</button><button type="button" class="secondary" data-action="avatar-random">Zufall</button><button type="button" class="primary" data-action="avatar-confirm" ${ageBand?'':'disabled'}>Charakter erstellen →</button>`;
 return `<section class="avatar-editor-shell ${isWardrobe?'wardrobe-mode':''}">
  <div class="avatar-editor-heading"><div>${heading}</div><div class="avatar-counts"><span>16 Frisuren</span><span>10 Farben</span><span>16 Gesichter</span>${isWardrobe?`<span>${tops.size}/16 Oberteile</span><span>${pants.size}/16 Hosen</span>`:''}</div></div>
  <div class="avatar-editor-grid">
   <section class="avatar-preview-panel panel" aria-label="Vorschau deiner Spielfigur"><div class="avatar-city-lines" aria-hidden="true"></div><div class="avatar-preview-badge">LICHTQUELL · ${isWardrobe?'GARDEROBE':'SPIELERFIGUR'}</div><div class="avatar-preview-stage">${A.markup(a,'editor-hero','Vorschau deiner Spielfigur')}<span class="avatar-preview-shadow"></span></div><div class="avatar-preview-copy">${copy}</div></section>
   <section class="avatar-controls panel">
    ${!isWardrobe?section('Wissens-Einstieg',ageBand?ageBands[ageBand].label:'Bitte Altersbereich wählen',ageOptions):''}
    ${section('Frisur','16 frei verfügbar',`<div class="avatar-options avatar-options-hair">${hairs}</div>`)}
    ${section('Haarfarbe','10 frei verfügbar',`<div class="avatar-options avatar-options-colors">${colors}</div>`)}
    ${section('Gesicht','16 Presets',`<div class="avatar-options avatar-options-face">${faces}</div>`)}
    ${section('Oberteil',`${tops.size} / 16 freigeschaltet`,`<div class="avatar-options avatar-options-clothes">${topsMarkup}</div><p class="avatar-field-note">Weitere Oberteile werden gefunden, erspielt oder später gekauft. Kleidung gibt keine Kampfwerte.</p>`)}
    ${section('Hose',`${pants.size} / 16 freigeschaltet`,`<div class="avatar-options avatar-options-clothes">${pantsMarkup}</div><p class="avatar-field-note">Kosmetik bleibt eine Stilentscheidung – kein Pflicht-Equipment für bessere Werte.</p>`)}
    <div class="avatar-editor-actions">${actions}</div>
   </section>
  </div>
  <aside class="avatar-principles"><strong>${isWardrobe?'Garderobenprinzip':'Designprinzip'}</strong><span>modular</span><span>nicht kindlich</span><span>cool + individuell</span><span>später erweiterbar</span></aside>
 </section>`;
}
function randomize(raw,wardrobe={tops:[0],pants:[0]}){const pick=list=>list[Math.floor(Math.random()*list.length)]??0;return A.normalize({...raw,face:Math.floor(Math.random()*16),hair:Math.floor(Math.random()*16),hairColor:Math.floor(Math.random()*10),top:pick(wardrobe.tops||[0]),pants:pick(wardrobe.pants||[0])});}
window.KnowstersAvatarEditor={markup,randomize};
})();
