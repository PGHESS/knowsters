/* Knowsters wardrobe model (v15 package). Keeps ownership/progression separate from avatar art. */
(()=>{'use strict';
const TYPES={top:{key:'tops',max:16},pants:{key:'pants',max:16}};
const clampId=(value,max)=>{const n=Number(value);return Number.isInteger(n)&&n>=0&&n<max?n:null;};
function normalize(raw={},avatar={top:0,pants:0}){
 raw=raw&&typeof raw==='object'?raw:{};avatar=avatar&&typeof avatar==='object'?avatar:{top:0,pants:0};
 const out={tops:[],pants:[],history:[]};
 for(const [type,meta] of Object.entries(TYPES)){
  const fallback=clampId(avatar[type],meta.max)??0;
  const list=Array.isArray(raw[meta.key])?raw[meta.key].map(v=>clampId(v,meta.max)).filter(v=>v!==null):[];
  out[meta.key]=[...new Set(list.length?list:[fallback])];
  if(!out[meta.key].length)out[meta.key]=[0];
 }
 if(Array.isArray(raw.history)){
  out.history=raw.history.filter(entry=>entry&&TYPES[entry.type]&&clampId(entry.id,TYPES[entry.type].max)!==null).map(entry=>({type:entry.type,id:Number(entry.id),source:String(entry.source||'unbekannt').slice(0,80)}));
 }
 return out;
}
function owns(raw,type,id){const meta=TYPES[type],valid=meta&&clampId(id,meta.max);if(!meta||valid===null)return false;const w=normalize(raw);return w[meta.key].includes(valid);}
function unlock(raw,type,id,source='Belohnung'){
 const meta=TYPES[type],valid=meta&&clampId(id,meta.max);if(!meta||valid===null)return{wardrobe:normalize(raw),unlocked:false};
 const w=normalize(raw);if(w[meta.key].includes(valid))return{wardrobe:w,unlocked:false};
 w[meta.key].push(valid);w[meta.key].sort((a,b)=>a-b);w.history.push({type,id:valid,source:String(source||'Belohnung').slice(0,80)});
 return{wardrobe:w,unlocked:true};
}
function count(raw){const w=normalize(raw);return{tops:w.tops.length,pants:w.pants.length,total:w.tops.length+w.pants.length};}
window.KnowstersWardrobe={normalize,owns,unlock,count,TYPES};
})();
