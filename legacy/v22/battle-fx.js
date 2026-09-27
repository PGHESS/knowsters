/* Timed poses and particles. No game state lives in the animation layer. */
window.KnowstersFX = class {
  constructor(stage) {
    this.stage=stage; this.canvas=stage.querySelector('canvas');
    this.ctx=this.canvas.getContext('2d');
    this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  wait(ms){return new Promise(r=>setTimeout(r,this.reduced?Math.min(ms,130):ms));}
  actor(side){return this.stage.querySelector('.battle-actor.'+side);}
  pose(side,name){this.actor(side).querySelector('.combat-sprite').dataset.pose=name;}
  async animate(el,frames,options){
    if(!el.animate||this.reduced){await this.wait(100);return;}
    try {await el.animate(frames,options).finished;} catch {}
  }
  callout(text){this.stage.querySelector('.battle-callout').textContent=text;}
  center(side){const a=this.actor(side).getBoundingClientRect(),b=this.stage.getBoundingClientRect();return{x:a.left-b.left+a.width*.5,y:a.top-b.top+a.height*.56};}
  async particles(kind,from,to,duration=620){
    if(!this.ctx){await this.wait(duration);return;}
    const box=this.stage.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    this.canvas.width=box.width*dpr;this.canvas.height=box.height*dpr;
    const c=this.ctx;c.setTransform(dpr,0,0,dpr,0,0);
    const origin=this.center(from),target=this.center(to);
    const colors={ember:['#fff4bb','#ffbb38','#ff6936'],tide:['#e5ffff','#7deaf9','#539df4'],moss:['#f1ffd5','#a0f59a','#41d7ad'],enemy:['#ffe5ff','#c8a5ff','#8e72f1'],guard:['#eaffd1','#99edb4','#64c998'],heal:['#ecffff','#9af4e9','#57bfcf'],focus:['#fffde0','#ffe3a0','#f5c764']};
    Object.assign(colors,{stone:['#fff0bb','#e9ad51','#ad703a'],poison:['#e6ff99','#a2db50','#738fda'],wind:['#ffffff','#c7efff','#75bfe6'],storm:['#ffffff','#bce3ff','#8c9dff'],crystal:['#ffffff','#ffe996','#efbd44']});
    const palette=colors[kind]||colors.focus;
    const local=from===to;
    const durationMs=this.reduced?160:duration;
    const seeds=Array.from({length:34},(_,i)=>({angle:i*2.3999,r:22+(i%7)*8,size:2+(i%4)*1.1}));
    await new Promise(resolve=>{let start=null;const frame=now=>{
      if(start===null)start=now;const p=Math.min(1,(now-start)/durationMs);
      c.clearRect(0,0,box.width,box.height);
      const travel=Math.min(1,p*1.5),impact=Math.max(0,(p-.55)/.45);
      const x=origin.x+(target.x-origin.x)*travel,y=origin.y+(target.y-origin.y)*travel-(local?0:Math.sin(travel*Math.PI)*28);
      c.save();c.globalCompositeOperation='lighter';
      if(this.reduced){c.globalAlpha=Math.sin(p*Math.PI)*.65;c.fillStyle=palette[1];c.beginPath();c.arc(target.x,target.y,30,0,Math.PI*2);c.fill();}
      else {
        for(let i=0;i<seeds.length;i++){
          const q=seeds[i],angle=q.angle+p*(local?2:1),radius=local?(18+Math.sin(p*Math.PI)*q.r):impact*q.r;
          let px=x+Math.cos(angle)*radius,py=y+Math.sin(angle)*radius;
          if(!local&&!impact){const lag=(i%12)*.018;px=origin.x+(target.x-origin.x)*Math.max(0,travel-lag);py=origin.y+(target.y-origin.y)*Math.max(0,travel-lag)-Math.sin(travel*Math.PI)*28+Math.sin(i*7+p*14)*(3+i%8);}
          if(kind==='heal')py-=p*30;
          c.globalAlpha=Math.max(0,Math.sin(p*Math.PI))*(.4+(i%3)*.3);
          c.fillStyle=palette[i%3];c.shadowColor=palette[1];c.shadowBlur=12;
          const size=q.size*(1+Math.sin(p*Math.PI)*.5);
          if(kind==='stone'){c.save();c.translate(px,py);c.rotate(angle);c.fillRect(-size,-size,size*2,size*2);c.restore();}
          else if(kind==='crystal'){c.beginPath();c.moveTo(px,py-size*2);c.lineTo(px+size,py);c.lineTo(px,py+size*2);c.lineTo(px-size,py);c.closePath();c.fill();}
          else if(kind==='wind'){c.strokeStyle=palette[i%3];c.lineWidth=2;c.beginPath();c.moveTo(px,py);c.lineTo(px+18,py-6);c.stroke();}
          else {c.beginPath();c.arc(px,py,kind==='poison'?size*2:size,0,Math.PI*2);c.fill();}
        }
        if(kind==='storm'&&!local){c.globalAlpha=Math.sin(p*Math.PI);c.strokeStyle=palette[0];c.lineWidth=3;c.beginPath();c.moveTo(origin.x,origin.y);for(let j=1;j<=8;j++)c.lineTo(origin.x+(x-origin.x)*j/8,origin.y+(y-origin.y)*j/8+(j%2?12:-12));c.stroke();}
        if(local||impact>0){c.globalAlpha=Math.sin(p*Math.PI)*.8;c.strokeStyle=palette[0];c.lineWidth=kind==='guard'?4:2;c.beginPath();c.ellipse(target.x,target.y,20+p*65,(kind==='guard'?42:18)+p*35,0,0,Math.PI*2);c.stroke();}
        else {c.globalAlpha=.8;c.shadowBlur=23;c.fillStyle=palette[0];c.beginPath();c.arc(x,y,kind==='ember'?10:7,0,Math.PI*2);c.fill();}
      }
      c.restore();if(p<1)requestAnimationFrame(frame);else{c.clearRect(0,0,box.width,box.height);resolve();}
    };requestAnimationFrame(frame);});
  }
  async number(side,label,type='damage'){
    const n=document.createElement('span');n.className='damage-number '+type;n.textContent=label;this.actor(side).appendChild(n);
    await this.animate(n,[{opacity:0,transform:'translate(-50%,12px) scale(.7)'},{opacity:1,transform:'translate(-50%,-5px) scale(1.15)',offset:.25},{opacity:1,transform:'translate(-50%,-20px) scale(1)',offset:.7},{opacity:0,transform:'translate(-50%,-38px) scale(1)'}],{duration:900,easing:'ease-out'});n.remove();
  }
  async hit(side,amount,blocked=0){
    const actor=this.actor(side);this.pose(side,'hurt');
    const number=this.number(side,amount?'−'+amount:'Geblockt',amount?'damage':'block');
    const flash=this.animate(actor.querySelector('.combat-sprite'),[{filter:'brightness(1)'},{filter:'brightness(3)',offset:.18},{filter:'brightness(1)',offset:.5},{filter:'brightness(1.8)',offset:.65},{filter:'brightness(1)'}],{duration:380});
    const direction=side==='player'?-1:1;
    await Promise.all([flash,this.animate(actor,[{transform:'translateX(0)'},{transform:`translateX(${direction*13}px)`,offset:.2},{transform:`translateX(${direction*-4}px)`,offset:.6},{transform:'translateX(0)'}],{duration:380,easing:'ease-out'})]);
    this.pose(side,'idle');await number;
  }
  async action(side,kind,label,onImpact){
    const other=side==='player'?'opponent':'player',local=['guard','heal','focus'].includes(kind),actor=this.actor(side);
    this.callout(label);this.pose(side,'charge');await this.wait(260);
    this.pose(side,'attack');
    const direction=side==='player'?1:-1;
    const motion=this.animate(actor,[{transform:'translate(0,0)'},{transform:`translate(${local?0:direction*28}px,-9px)`,offset:.35},{transform:'translate(0,0)'}],{duration:600,easing:'ease-in-out'});
    await this.particles(kind,side,local?side:other,local?650:580);
    await onImpact();await motion;this.pose(side,'idle');
  }
};
