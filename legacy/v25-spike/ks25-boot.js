(()=>{'use strict';
const KS=window.KS25,{W,H,COLORS}=KS;
const showError=(reason)=>{const box=document.getElementById('load-error'),detail=document.getElementById('load-error-detail');const lines=[
 'Grund: '+reason,
 'Fehler: '+((window.__ks25Errors&&window.__ks25Errors.length)?window.__ks25Errors.join(' | '):'keine JS-Exception erfasst'),
 'Phaser: '+(window.Phaser?window.Phaser.VERSION:'nicht geladen'),
 'Build: v25 spike (M0-Referenz, Query v=26)',
 'UA: '+navigator.userAgent,
 'Viewport: '+window.innerWidth+'×'+window.innerHeight+' @'+(window.devicePixelRatio||1)+'x',
 'WebGL: '+(()=>{try{const c=document.createElement('canvas');return c.getContext('webgl2')?'webgl2':c.getContext('webgl')?'webgl1':'nicht verfügbar';}catch(e){return 'Fehler '+e.message;}})()
];detail.textContent=lines.join('\n');box.hidden=false;};
if(!window.Phaser){showError('window.Phaser fehlt (phaser.min.js nicht geladen oder Parse-Fehler)');return;}
class BootScene extends Phaser.Scene{constructor(){super('Boot');}preload(){this.load.image('world','../v22/assets/village-map.webp');this.load.image('guardians','../v22/assets/guardians-prolog.webp');this.load.image('lumi','../v22/assets/battle-lumi.webp');this.load.image('pyro','../v22/assets/battle-pyro.webp');this.load.image('terra','../v22/assets/battle-terra.webp');this.load.image('nivaro','../v22/assets/battle-nivaro.webp');this.load.image('rush','../v22/assets/battle-enemy-rush.webp');this.load.image('flicker','../v22/assets/battle-enemy-flicker.webp');this.load.image('brute','../v22/assets/battle-enemy-brute.webp');const fill=this.add.rectangle(W/2-115,H/2+26,0,7,COLORS.cyan).setOrigin(0,.5);this.add.rectangle(W/2,H/2+26,230,7,0x173240).setOrigin(.5).setDepth(-1);this.add.text(W/2,H/2-18,'KNOWSTERS',KS.textStyle(30,'#f2fbff','700')).setOrigin(.5);this.add.text(W/2,H/2+5,'V25 RENDERING SPIKE · REFERENZ',KS.textStyle(10,'#7edee7','700')).setOrigin(.5);this.load.on('progress',v=>fill.displayWidth=230*v);}create(){this.scene.start('Menu');}}
try{
 const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:W,height:H,backgroundColor:'#07131f',antialias:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:W,height:H},scene:[BootScene,KS.MenuScene,KS.WorldScene,KS.BattleScene]});
 window.addEventListener('resize',()=>game.scale.refresh());
 game.events.once('ready',()=>{const r=game.renderer;console.log('Knowsters v25 spike ready · renderer',r&&r.type===Phaser.WEBGL?'WebGL':'Canvas');});
}catch(e){showError('Phaser.Game konnte nicht erzeugt werden: '+(e&&e.message?e.message:e));}
})();
