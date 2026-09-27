const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../v22/avatar.js'),'utf8'),ctx);
const A=ctx.window.KnowstersAvatar;
assert.equal(A.hairColors.length,10);assert.equal(A.skinTones.length,16);assert.equal(A.topColors.length,16);assert.equal(A.pantsColors.length,16);
assert.deepEqual(JSON.parse(JSON.stringify(A.normalize({face:99,hair:-4,hairColor:9,top:15,pants:8}))),{face:15,hair:0,hairColor:9,top:15,pants:8});
const html=A.markup({face:3,hair:12,hairColor:8,top:4,pants:6},'test');
for(const token of ['human-avatar-sprite','data-face="3"','data-hair="12"','--avatar-hair:','#7356c9','data-top="4"','data-pants="6"'])assert.ok(html.includes(token),token);
console.log('PASS: avatar schema supports 16 faces, 16 hairstyles, 10 hair colors, 16 tops and 16 pants with bounded values.');
