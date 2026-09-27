const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={window:{},Math};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../v22/progression.js'),'utf8'),ctx);const P=ctx.window.KnowstersProgress;
assert.equal(Object.keys(P.domains).length,10);assert.equal(P.attributeDefs.length,10);
for(const id of ['moss','ember','tide'])for(let n=0;n<40;n++){
 const pet=P.createPet({speciesId:id});const potentials=P.attributeDefs.map(d=>pet.attributes[d.id].potential);
 assert.equal(potentials.reduce((a,b)=>a+b,0),8000);assert.ok(potentials.every(x=>x<=999&&x>=500));
 for(const d of P.attributeDefs)assert.ok(pet.attributes[d.id].value<=pet.attributes[d.id].potential);
}
const k=P.createKnowledge('12-13');assert.equal(P.knowledgeTrack('math',k,'12-13').tier,4);assert.equal(P.knowledgeTrack('economy',k,'12-13').tier,1);
const untestedAge=P.createKnowledge('12-13');const rePlaced=P.normalizeKnowledge(untestedAge,'25-40');assert.equal(rePlaced.ageBand,'25-40');assert.equal(rePlaced.domains.math.level,6);assert.equal(rePlaced.domains.media.level,5);const practiced=P.createKnowledge('12-13');const practicedTask=P.generate('math',practiced,'12-13');P.recordKnowledge(practiced,'math',practicedTask.topicId);const practicedLevel=practiced.domains.math.level;const practicedAfterAge=P.normalizeKnowledge(practiced,'25-40');assert.equal(practicedAfterAge.domains.math.level,practicedLevel);
for(const kind of Object.keys(P.domains))for(let i=0;i<20;i++){const q=P.generate(kind,k,'16-17');assert.ok(q&&q.options.length===4,kind);assert.ok(q.options.includes(q.answer),kind);assert.ok(q.explanation.length>10,kind);}
const pet=P.createPet({speciesId:'ember'}),attr='attack',before=pet.attributes[attr].value,need=P.attributeCost(before);const result=P.trainAttribute(pet,attr,2);assert.equal(result.development,2);assert.ok(pet.attributes[attr].value===before||pet.attributes[attr].value===before+1);assert.ok(pet.attributes[attr].progress<Math.max(need,P.attributeCost(pet.attributes[attr].value)));
const knowledge=P.createKnowledge('18-24');const mediaTask=P.generate('media',knowledge,'18-24');const award=P.awardLearning(pet,knowledge,'media','focus',mediaTask.topicId);assert.equal(knowledge.domains.media.correct,1);assert.equal(pet.solved.media,1);assert.equal(award.attribute.development,2);
const q1=P.generate('logic',knowledge,'18-24');P.recordWrong(knowledge,'logic');const q2=P.generate('logic',knowledge,'18-24',q1.prompt);assert.notEqual(q2.prompt,q1.prompt);assert.equal(knowledge.domains.logic.correct,0);assert.equal(knowledge.domains.logic.wrong,1);
for(const kind of Object.keys(P.domains)){assert.equal(P.curriculum[kind].length,8,kind);for(let tier=0;tier<8;tier++){const stage=P.curriculumStage(kind,tier);assert.ok(stage.id&&stage.title&&stage.goal,kind+' '+tier);const source=P.createKnowledge('18-24');source.domains[kind].level=tier;const q=P.generate(kind,source,'18-24');assert.equal(q.tier,tier,kind+' tier '+tier);assert.equal(q.topicId,stage.id,kind+' topic '+tier);assert.ok(q.learningGoal.length>10,kind+' goal '+tier);}}
assert.equal(P.topicStats(knowledge,'media',mediaTask.topicId).correct,1);
console.log('PASS: v17 has 10 subjects with 8 structured levels each, age-based placement, topic mastery, 10 attributes, 8,000 potential points and +2 development.');
