const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const values=new Map(),localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
const context={window:{},localStorage};vm.createContext(context);vm.runInContext(fs.readFileSync('ui/course-progress.js','utf8'),context);const cp=context.window.CourseProgress;
function set(v,p,l,record){localStorage.setItem(cp.key(v,p,l),JSON.stringify(record))}
const info=cp.meta('bev','motor'),answers=info.optionCounts.map(()=>0),completeLearning={read:true,quizReview:true,answers,gameResults:[]};
assert.equal(cp.trainingUnlocked('bev','motor'),false);
set('bev','motor',null,{stage:2,completed:true,read:false,answers});assert.equal(cp.trainingUnlocked('bev','motor'),false,'stage and result flags alone cannot bypass learning');
set('bev','motor',null,{readingPercent:50,answers:[],gameResults:[]});assert.equal(cp.status('bev','motor').percent,20);
set('bev','motor',null,{read:true,quizReview:true,answers:answers.slice(1),gameResults:[]});assert.equal(cp.trainingUnlocked('bev','motor'),false,'partial practice stays locked');
set('bev','motor',null,completeLearning);assert.equal(cp.trainingUnlocked('bev','motor'),true);assert.equal(cp.status('bev','motor').percent,100);assert.equal(cp.status('bev','motor').completed,false,'learning and training are distinct');
assert.equal(cp.trainingUnlocked('phev','motor'),false,'another vehicle needs its own part record');
assert.equal(cp.courseForGame('motor',{vehicle:'phev',part:'dht'}),null,'unrelated part is rejected');assert.equal(cp.courseForGame('motor',{vehicle:'phev',part:'motor'}).unlocked,false);
set('bev','motor',null,{...completeLearning,gameResults:info.games.map(level=>({level,demo:true}))});assert.equal(cp.status('bev','motor').completed,false,'demonstrations do not count as completed repair');
set('bev','motor',null,{...completeLearning,gameResults:info.games.map(level=>({level,demo:false}))});assert.equal(cp.status('bev','motor').completed,true);
localStorage.setItem('et_session',JSON.stringify('qa-other'));assert.equal(cp.trainingUnlocked('bev','motor'),false,'accounts are isolated');localStorage.removeItem('et_session');
set('bev',null,1,{read:true,quizReview:true,answers:cp.meta('bev',null,1).optionCounts.map(()=>0),gameResults:[]});assert.equal(cp.trainingUnlocked('fcev',null,1),true,'foundation progress is shared across selected vehicle tabs');assert.equal(cp.key('bev',null,1),cp.key('phev',null,1));
set('bev','motor',null,completeLearning);assert.equal(cp.recordTraining('bev','motor',{level:'dht_oil',stars:3,mistakes:0,seconds:20,demo:false}),null);
assert(cp.recordTraining('bev','motor',{level:'motor',stars:3,mistakes:0,seconds:20,demo:false}));assert.equal(cp.status('bev','motor').trainingDone,1);
assert(cp.recordTraining('bev','motor',{level:'motor',stars:1,mistakes:0,seconds:22,demo:true}));assert.equal(cp.status('bev','motor').trainingDone,1,'replaying a demo preserves earned completion');
assert.equal(cp.recordTraining('phev','motor',{level:'motor',stars:3,mistakes:0,seconds:20,demo:false}),null,'standalone training cannot save against unlearned course');
localStorage.setItem('et_courseflow:phev:lesson-7',JSON.stringify({read:true,quizReview:true,answers:cp.meta('bev',null,7).optionCounts.map(()=>0),gameResults:[]}));assert.equal(cp.status('bev',null,7).learningCompleted,true,'old foundation progress under a vehicle key remains visible');
const games=new Set();let chapters=0,relations=0;for(const [vehicle,parts]of Object.entries(cp.chapters))for(const [part,m]of Object.entries(parts)){chapters++;assert(m.quizTotal>0&&m.quizTotal===m.optionCounts.length);for(const game of m.games){games.add(game);relations++;const mapped=cp.courseForGame(game,{vehicle,part});assert(mapped&&mapped.vehicle===vehicle&&mapped.part===part)}}
assert.equal(chapters,53);assert.equal(games.size,50);
console.log('PASS: saved reading/practice progress, prerequisite gates, legacy migration, account/vehicle isolation, real training vs demo; '+chapters+' chapters, '+games.size+' games, '+relations+' exact associations.');
