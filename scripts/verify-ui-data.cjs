const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
function source(name){const expression=new RegExp('function '+name+'\\([^]*?(?=\\nfunction |\\n/\\*|\\nvar )');const match=html.match(expression);assert(match,name+' exists');return match[0]}
const storage={'rg_star_motor':'2','rg_star_battery':'0','et_exambest:dg:tester':87,'et_exambest:wx:tester':62,'et_exambest:dg':99,'et_trainer_n:tester':5};
let file,clicked=false;
const context={localStorage:{getItem:k=>storage[k]},GLEVELS:['motor','battery'],BANKS:[{id:'dg'},{id:'wx'}],PEXAMB:'et_exambest',PTRN:'et_trainer_n',get:(k,d)=>storage[k]??d,ukey:k=>k+':tester',passed:()=>[1,2],Blob,URL:{createObjectURL:blob=>(file=blob,'blob:test')},document:{createElement:()=>({click:()=>{clicked=true}})}};
vm.createContext(context);
vm.runInContext(source('levelDone')+'\n'+source('gameDone')+'\n'+source('exportData'),context);
assert.equal(context.levelDone('motor'),true);assert.equal(context.levelDone('battery'),false);assert.equal(context.levelDone('hvil'),false);assert.equal(context.gameDone(),1);
context.exportData();assert(clicked,'export download starts');
file.text().then(text=>{const data=JSON.parse(text);assert.equal(data.exam_best,87);assert.equal(data.trainer_sessions,5);assert.deepEqual(data.lessons_passed,[1,2]);console.log('PASS: per-level completion, total completion and current-user data export (0–100 score scale).')});
