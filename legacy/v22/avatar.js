/* Human player-avatar model. The data schema stays independent from final art so
   CSS sprites can later be replaced by illustrations/sprite sheets without save migration. */
(()=>{'use strict';
const clamp=(value,max)=>Math.max(0,Math.min(max-1,Number.isFinite(+value)?Math.trunc(+value):0));
const hairColors=['#18191f','#3a2a25','#6a4631','#9d5737','#d79b52','#e6d4b8','#d8dbe6','#31bdd7','#7356c9','#d742a7'];
const hairColorNames=['Schwarz','Dunkelbraun','Braun','Kupfer','Goldbraun','Hellblond','Silber','Cyan','Violett','Magenta'];
const hairNames=['Kurz & locker','Fade','Kurz geschnitten','Seitenscheitel','Schulterlang','Locken','Buzz Cut','Asymmetrisch','Wellen','Lang','Undercut','Stachelig','Afro','Bob','Langer Zopf','Messy'];
const faceProfiles=[
 ['#f6d3bd','48% 48% 44% 44%','1','1'],['#efc5ad','46% 46% 50% 50%','.94','1.04'],['#e9b896','48% 48% 42% 42%','1.04','.98'],['#dda47f','52% 52% 45% 45%','.98','1.02'],
 ['#cc8d68','45% 45% 48% 48%','1.08','.96'],['#b97855','50% 50% 40% 40%','.96','1.05'],['#a96849','43% 43% 48% 48%','1.1','.95'],['#8f583d','55% 55% 38% 38%','.94','1.08'],
 ['#7b4934','46% 46% 43% 43%','1.05','1'],['#6a3f2f','50% 50% 50% 50%','1','1.05'],['#5b372b','42% 42% 47% 47%','1.08','.98'],['#4b3029','54% 54% 42% 42%','.95','1.07'],
 ['#e2af8d','48% 48% 50% 50%','1.02','1.02'],['#bd7b5a','44% 44% 42% 42%','1.07','1'],['#956047','52% 52% 47% 47%','.97','1.06'],['#704632','46% 46% 40% 40%','1.05','1.03']
];
const faceNames=Array.from({length:16},(_,i)=>`Gesicht ${String(i+1).padStart(2,'0')}`);
const topColors=['#1a2838','#263747','#30495a','#25333d','#4b2f32','#684135','#32473f','#4d3b60','#283d63','#3d5368','#5f676f','#1e5961','#6a5130','#5c293f','#284a33','#343642'];
const topNames=['Urban Jacket','Layer Hoodie','Field Overshirt','Light Shell','Signal Jacket','Workshop Coat','Park Utility','Violet Layer','Night Runner','City Denim','Graphite Vest','Harbor Shell','Amber Utility','Magenta Layer','Green Field','Classic Dark'];
const pantsColors=['#17202a','#232b34','#2c3640','#34383f','#2f3340','#29394a','#3e3a39','#453f36','#1f3440','#28323c','#35303d','#2e4040','#3b4550','#22262c','#4a423c','#30343a'];
const pantsNames=['Urban Cargo','Straight Utility','City Denim','Graphite Fit','Night Tech','Explorer Cargo','Workshop Pants','Canvas Wide','Harbor Utility','Street Fit','Violet Tech','Field Cargo','Slate Wide','Runner Pants','Earth Canvas','Classic Dark'];
const defaults={face:2,hair:0,hairColor:1,top:0,pants:0};
function normalize(raw={}){return{face:clamp(raw.face,16),hair:clamp(raw.hair,16),hairColor:clamp(raw.hairColor,10),top:clamp(raw.top,16),pants:clamp(raw.pants,16)};}
function cssVars(raw={}){const a=normalize(raw),f=faceProfiles[a.face];return `--avatar-skin:${f[0]};--avatar-face-radius:${f[1]};--avatar-face-x:${f[2]};--avatar-face-y:${f[3]};--avatar-hair:${hairColors[a.hairColor]};--avatar-top:${topColors[a.top]};--avatar-pants:${pantsColors[a.pants]}`;}
function markup(raw={},className='',label='Deine Spielfigur'){const a=normalize(raw);return `<span class="human-avatar-sprite ${className}" data-face="${a.face}" data-hair="${a.hair}" data-top="${a.top}" data-pants="${a.pants}" style="${cssVars(a)}" role="img" aria-label="${label}"><span class="human-head"><i class="human-hair"></i><i class="human-brow left"></i><i class="human-brow right"></i><i class="human-nose"></i><i class="human-mouth"></i></span><i class="human-neck"></i><span class="human-body"><i class="human-shirt"></i><i class="human-jacket left"></i><i class="human-jacket right"></i></span><i class="human-arm left"></i><i class="human-arm right"></i><i class="human-leg left"></i><i class="human-leg right"></i><i class="human-shoe left"></i><i class="human-shoe right"></i></span>`;}
const skinTones=faceProfiles.map(x=>x[0]);
window.KnowstersAvatar={defaults,normalize,markup,hairColors,hairColorNames,hairNames,faceProfiles,faceNames,skinTones,topColors,topNames,pantsColors,pantsNames};
})();
