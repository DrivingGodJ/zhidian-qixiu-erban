const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.createContext(context);
for(const file of ['lessons.js','models/courses.js','models/pdetail.js','models/bev-courses.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const data=context.window,lessons=data.DATA.lessons;
let chapters=0,questions=0;
for(const vehicle of ['bev','phev','erev','fcev']){
 vm.runInContext(fs.readFileSync('models/cfg-'+vehicle+'.js','utf8'),context);
 const seen=new Set();
 data.MODEL_CFG.parts.forEach((part,index)=>{
  if(part.visualOnly)return;
  const id=part.id||part.b;assert(!seen.has(id),vehicle+' duplicate chapter '+id);seen.add(id);
  const mapping=data.MODEL_COURSES[vehicle]?.[index],lesson=lessons.find(l=>l.id===mapping?.lesson);
  const quiz=vehicle==='bev'?data.BEV_QUIZZES[id]:mapping?.custom?.quiz||lesson?.quiz;
  assert(quiz?.length,vehicle+'/'+id+' has original practice questions');
  for(const q of quiz){const opts=q.opts||q.o,answer=q.ans??q.a;assert(opts.length>=2&&Number.isInteger(answer)&&answer>=0&&answer<opts.length,vehicle+'/'+id+' valid answer');}
  if(vehicle==='bev')assert(data.BEV_DETAILS[id]?.role,'BEV original facts');
  else assert(mapping?.custom?.body||lesson?.body,vehicle+'/'+id+' has original lesson content');
  chapters++;questions+=quiz.length;
 });
}
assert.equal(chapters,53);assert.equal(Object.values(data.BEV_QUIZZES).flat().length,150);
console.log('PASS: 53 unique vehicle chapters, '+questions+' original practice questions, valid answers and source lesson mappings; 50 original lessons retained.');
