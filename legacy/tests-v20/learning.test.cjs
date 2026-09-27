const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{},Math};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('node:path').resolve(__dirname,'../v22/progression.js'),'utf8'),ctx);const P=ctx.window.KnowstersProgress;
function numericAnswer(task){
 const p=task.prompt;let m;
 if((m=p.match(/^Wie viel ist (\d+)\/(\d+) von (\d+)\?/)))return +m[1]/+m[2]*+m[3];
 if((m=p.match(/^Wie viel sind (\d+) % von (\d+)\?/)))return +m[1]/100*+m[2];
 if((m=p.match(/^Ein Gegenstand kostet (\d+) Münzen\. Du erhältst (\d+) % Rabatt/)))return +m[1]*(1-(+m[2]/100));
 if((m=p.match(/^Finde x: (\d+) × x \+ (\d+) = (\d+)/)))return(+m[3]-+m[2])/(+m[1]);
 let expression=p.replace(/ = \?$/,'').replace(/(\d+) % von (\d+)/g,'($1/100*$2)').replace(/(\d+)\/(\d+)/g,'($1/$2)').replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-');
 assert.match(expression,/^[\d\s+*\-/().]+$/);return vm.runInNewContext(expression);
}
let checked=0;for(const count of P.thresholds){for(let i=0;i<120;i++){
 const t=P.math(count),expected=numericAnswer(t),actual=vm.runInNewContext(t.answer);assert.ok(Math.abs(expected-actual)<1e-8,JSON.stringify(t));assert.equal(t.options.length,4);assert.equal(new Set(t.options).size,4);const equivalents=t.options.map(x=>vm.runInNewContext(x)).filter(v=>Math.abs(v-actual)<1e-8);assert.equal(equivalents.length,1,JSON.stringify(t));assert.ok(t.explanation.length>15);checked++;
}}
for(const kind of ['logic','language'])for(const count of P.thresholds){for(let i=0;i<25;i++){const q=P[kind](count);assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));assert.ok(q.explanation);}}
const p=P.createPet();for(let i=0;i<27;i++)P.award(p,'math');assert.equal(P.track('math',p.mastery.math).title,'Prozentrechnung');assert.equal(P.track('language',p.mastery.language).tier,0);assert.equal(p.skillPoints,5);assert.ok(P.thresholds[6]-P.thresholds[5]>P.thresholds[1]-P.thresholds[0]);
console.log(`PASS: ${checked} generated math tasks independently recalculated, unique correct choices, all learning tiers, subject isolation and slower advanced progression.`);
