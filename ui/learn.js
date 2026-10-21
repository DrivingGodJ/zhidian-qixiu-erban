import { LESSON_VISUALS, mountLessonVisuals } from './lesson-visuals.js?v=progress-2';
import { brandComparisonConfig, mountBrandComparisons, contextualBrandBody } from './brand-comparisons.js?v=brands-1';
// One course, one sequence, one navigation bar. Existing course facts and answers are reused.
const query=new URLSearchParams(location.search);
const vehicle=query.has('lesson')?'bev':['bev','phev','erev','fcev'].includes(query.get('vehicle'))?query.get('vehicle'):'bev';
const content=document.getElementById('lessonContent'),next=document.getElementById('nextStep'),prev=document.getElementById('prevStep'),hint=document.getElementById('stepHint');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('课程资料暂时无法加载'));document.head.append(s)})}
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
let course,record,storageKey,frame,courseInfo,unmountVisuals=null,gameStatus='loading',renderToken=0,readingVisualMode='whole';
function updateProgress(){const progress=CourseProgress.status(vehicle,course.partId,course.lessonId);document.getElementById('learningProgress').value=progress.percent;document.getElementById('learningProgressLabel').textContent='学习 '+progress.percent+'%';}
function learningDone(){return CourseProgress.learningDone(record,courseInfo)}
function guardStage(stage){if(stage>0&&!record.read)return 0;if(stage>=2&&!learningDone())return 1;return Math.max(0,Math.min(stage,names().length-1));}
function readingProgress(){if(!record||record.stage!==0)return;const range=content.scrollHeight-content.clientHeight,percent=range<8?100:Math.max(0,Math.min(100,Math.round(content.scrollTop/range*100)));if(percent>(+record.readingPercent||0)||Math.abs((record.readingOffset||0)-content.scrollTop)>25){record.readingPercent=Math.max(+record.readingPercent||0,percent);record.readingOffset=content.scrollTop;save()}const ready=record.read||record.readingPercent>=99;next.disabled=!ready;next.textContent=ready?'学完了，做练习':'阅读完成后继续';hint.textContent=ready?'阅读已保存，可以进入本课练习。':'阅读至末尾后，继续本课练习。';}
content.addEventListener('scroll',readingProgress,{passive:true});
function quizAttempt(value){return Number.isSafeInteger(value?.quizAttempt)&&value.quizAttempt>=0?value.quizAttempt:0;}
function mergeProgress(latest){
 latest=latest&&typeof latest==='object'&&!Array.isArray(latest)?latest:{};
 const learned=learningDone()||CourseProgress.learningDone(latest,courseInfo),attempt=quizAttempt(record),latestAttempt=quizAttempt(latest);
 const validAnswer=(answer,i)=>Number.isInteger(answer)&&answer>=0&&answer<courseInfo.optionCounts[i];
 const answers=value=>Array.from({length:Math.min(course.quiz.length,Array.isArray(value?.answers)?value.answers.length:0)},(_,i)=>validAnswer(value.answers[i],i)?value.answers[i]:null);
 if(attempt===latestAttempt){
  const local=answers(record),remote=answers(latest);
  record.answers=Array.from({length:Math.max(local.length,remote.length)},(_,i)=>validAnswer(local[i],i)?local[i]:remote[i]??null);
  record.quizReview=record.quizReview===true||latest.quizReview===true;
 }
 record.quizAttempt=attempt;
 record.read=record.read===true||latest.read===true;
 record.readingPercent=Math.max(...[record.readingPercent,latest.readingPercent,record.read?100:0].map(value=>Math.max(0,Math.min(100,Number(value)||0))));
 const results=new Map();
 for(const result of [...(record.gameResults||[]),...(latest.gameResults||[])]){
  if(!result||!course.games.includes(result.level)||!Number.isInteger(result.stars)||result.stars<0||result.stars>3||!Number.isInteger(result.mistakes)||result.mistakes<0||!Number.isFinite(result.seconds)||result.seconds<0)continue;
  const previous=results.get(result.level),stamp=value=>Number.isFinite(value.completedAt)?value.completedAt:0;
  if(!previous||(previous.demo&&!result.demo)||(!!previous.demo===!!result.demo&&stamp(result)>=stamp(previous)))results.set(result.level,{...result,demo:!!result.demo});
 }
 record.gameResults=course.games.map(level=>results.get(level)||null);
 record.learningCompleted=learned||learningDone();
 record.completed=record.learningCompleted&&course.games.every(level=>results.has(level)&&!results.get(level).demo);
 // Navigation stays local. A stale tab cannot restore answers from before an
 // explicit redo in another tab, or erase the newest attempt's partial answers.
 return latestAttempt>attempt?{...record,quizAttempt:latestAttempt,answers:answers(latest),quizReview:latest.quizReview===true}:{...record};
}
function courseAccessible(){return !course?.paid||!window.DemoAccess||DemoAccess.allowed('courses')}
function ensureCourseOwner(){if(CourseProgress.key(vehicle,course.partId,course.lessonId)!==storageKey){location.reload();return false;}return true;}
function save(){if(!courseAccessible())return;if(CourseProgress.key(vehicle,course.partId,course.lessonId)!==storageKey){location.reload();return;}record.updatedAt=Date.now();record.quizTotal=course.quiz.length;const snapshot=mergeProgress(CourseProgress.get(vehicle,course.partId,course.lessonId));try{localStorage.setItem(storageKey,JSON.stringify(snapshot))}catch{}updateProgress()}
function names(){return course.games.length?['学原理','做练习','维修实训','学习结果']:['学原理','做练习','学习结果']}
function steps(){const list=names();return '<ol id="lessonSteps" style="--step-count:'+list.length+'" aria-label="课程进度">'+list.map((name,i)=>'<li class="'+(i===record.stage?'active':i<record.stage?'completed':'')+'"'+(i===record.stage?' aria-current="step"':'')+'><span class="step-number">'+String(i+1)+'</span><span>'+name+'</span></li>').join('')+'</ol>'}
function title(text){document.getElementById('courseTitle').textContent=course.title;document.getElementById('courseMeta').textContent=text;document.title=course.title+' · '+text+' | 智电汽修'}
function model(){return course.builder?'<div class="lesson-model"><iframe src="/models/component.html?part='+encodeURIComponent(course.builder)+'&title='+encodeURIComponent(course.title)+'" title="'+esc(course.title)+' 3D 模型" loading="lazy"></iframe></div><p class="model-note">旋转、缩放，查看部件结构。</p>':''}
function section(name,body){return body?'<section class="lesson-section"><h2>'+esc(name)+'</h2>'+body+'</section>':''}
function mountReadingVisuals(host,hasBrands){
 if(!hasBrands||LESSON_VISUALS[course.lessonId]?.kind!=='whole')return hasBrands?mountBrandComparisons(host,course):mountLessonVisuals(host,course.lessonId);
 const label=document.createElement('label');label.className='reading-visual-mode';
 const name=document.createElement('span');name.textContent='观察内容';
 const select=document.createElement('select');select.setAttribute('aria-label','观察内容');
 for(const [value,text]of [['whole','整车动力布局'],['brand','品牌部件比较']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option)}
 select.value=readingVisualMode;label.append(name,select);
 const viewport=document.createElement('div');viewport.className='reading-visual-content';host.append(label,viewport);
 let cleanup=null;
 function mount(){const top=content.scrollTop,left=content.scrollLeft;if(cleanup)cleanup();viewport.replaceChildren();cleanup=readingVisualMode==='brand'?mountBrandComparisons(viewport,course):mountLessonVisuals(viewport,course.lessonId);content.scrollTop=top;content.scrollLeft=left}
 select.addEventListener('change',()=>{readingVisualMode=select.value;mount()});mount();
 return ()=>{if(cleanup){cleanup();cleanup=null}host.replaceChildren()};
}
function setStage(stage){record.stage=guardStage(stage);if(record.stage===0)record.readingOffset=0;const url=new URL(location.href);url.searchParams.set('step',record.stage);history.pushState({stage:record.stage},'',url);save();render();content.scrollTop=0;document.getElementById('courseTitle').focus({preventScroll:true})}
function resetPractice(){const latest=CourseProgress.get(vehicle,course.partId,course.lessonId);record.quizAttempt=Math.max(Date.now(),quizAttempt(record)+1,quizAttempt(latest)+1);record.answers=[];record.question=0;record.quizReview=false;setStage(1)}
function buttonState(label,action,disabled=false){next.textContent=label;next.disabled=disabled;next.onclick=action}
function render(){
 if(!courseAccessible()){if(unmountVisuals){unmountVisuals();unmountVisuals=null}frame=null;DemoAccess.mountLearnGate(course.title);return;}
 const token=++renderToken;if(unmountVisuals){unmountVisuals();unmountVisuals=null;}frame=null;record.stage=guardStage(record.stage);content.classList.remove('game-mode');content.innerHTML=steps();updateProgress();
 const resultStage=names().length-1;prev.hidden=record.stage===0;prev.disabled=false;prev.textContent='上一步';prev.onclick=()=>setStage(record.stage-1);
 if(record.stage===0){
  title('1 / '+names().length+' · 学原理');
  const d=course.detail||{},hasBrands=!!brandComparisonConfig(course),parts=[section('本课要认识什么','<p>'+esc(d.role||course.description)+'</p>'),hasBrands?'':model()];
  if(course.partId)parts.unshift('<p class="learning-prerequisite">学完原理并完成本课练习后，解锁对应实训。</p>');
  if(d.structure?.length)parts.push(section('结构与原理','<ul>'+d.structure.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'));
  if(course.body)parts.push(section('课程讲解','<div class="lesson-prose">'+course.body+'</div>'));
  if(course.extraBody)parts.push('<details class="lesson-section"><summary>进阶阅读</summary><div class="lesson-prose">'+course.extraBody+'</div></details>');
  if(d.faults?.length)parts.push(section('常见故障与排查',d.faults.map(f=>'<article class="fault-note"><h3>'+esc(f.name)+'</h3><p>原因：'+esc(f.cause)+'</p><p>排查：'+esc(f.fix)+'</p></article>').join('')));
  if(d.safety)parts.push(section('作业安全','<p>'+esc(d.safety)+'</p>'));
  const article=document.createElement('article');article.className='lesson-prose course-reading';article.innerHTML=parts.join('');content.append(article);
  if(hasBrands||course.lessonId){const visualHost=document.createElement('div'),intro=article.querySelector('.lesson-section');if(intro)intro.after(visualHost);else article.prepend(visualHost);unmountVisuals=mountReadingVisuals(visualHost,hasBrands);}
  buttonState('学完了，做练习',()=>{if(!record.read&&record.readingPercent<99)return;record.read=true;record.readingPercent=100;setStage(1)},!record.read);
  requestAnimationFrame(()=>{if(renderToken!==token)return;content.scrollTop=record.readingOffset||0;readingProgress()});
 }else if(record.stage===1){
  title('2 / '+names().length+' · 做练习');renderQuiz();
 }else if(record.stage===resultStage){renderResult()}
 else{
  title('3 / 4 · 维修实训');content.classList.add('game-mode');gameStatus='loading';
  const stage=document.createElement('div');stage.className='training-stage';
  frame=document.createElement('iframe');frame.id='trainingFrame';frame.title=course.title+' · 实训 '+(record.gameIndex+1);frame.src='/videos/repair-game.html?level='+encodeURIComponent(course.games[record.gameIndex])+'&v=progress-2&embed=1&host=course&vehicle='+vehicle+'&part='+encodeURIComponent(course.partId);
  stage.append(frame);content.append(stage);hint.textContent='正在准备实训 '+(record.gameIndex+1)+' / '+course.games.length+'…';buttonState('正在加载…',null,true);
  frame.onload=()=>{if(renderToken!==token)return;try{frame.contentWindow.postMessage({type:'studio:game-command',action:'status'},location.origin)}catch{}};
 }
}
function rememberWrong(q){if(!ensureCourseOwner()||!courseAccessible())return;const session=read('et_session',null),key='et_wrong'+(session?':'+session:''),items=read(key,{});items[q.q]??={q:q.q,opts:q.opts,ans:q.ans,exp:q.exp,from:course.title,n:0};items[q.q].n++;items[q.q].last=Date.now();try{localStorage.setItem(key,JSON.stringify(items))}catch{}}
function markPassed(){
 if(!ensureCourseOwner()||!courseAccessible())return;
 if(!course.quiz.length||record.answers.some((a,i)=>a!==course.quiz[i].ans)||record.answers.length!==course.quiz.length)return;
 const session=read('et_session',null),key='et_lessons'+(session?':'+session:'');
 const old=read(key,[]);for(const id of course.progressLessonIds||[])if(!old.includes(id))old.push(id);try{localStorage.setItem(key,JSON.stringify(old));if(course.partIndex>=0)localStorage.setItem('et_vpart:'+vehicle+':'+course.partIndex,'1')}catch{}
}
function renderQuiz(){
 const questions=course.quiz;
 if(!questions.length){content.insertAdjacentHTML('beforeend','<div class="course-result"><h2>本课为阅读课程</h2><p>已保留原有课程内容；本节没有配套题目。</p></div>');hint.textContent='继续下一步。';buttonState(course.games.length?'进入维修实训':'查看学习结果',()=>setStage(2));return}
 if(record.quizReview){
  prev.textContent='返回原理';prev.onclick=()=>setStage(0);
  markPassed();const correct=record.answers.filter((a,i)=>a===questions[i].ans).length;
  content.insertAdjacentHTML('beforeend','<section class="course-result"><p class="result-eyebrow">练习结果</p><h2>答对 '+correct+' / '+questions.length+' 题</h2><p>'+(correct===questions.length?'本课练习已通过。':'本课练习已完成，可以复习错题或继续实训。')+'</p><button class="secondary" id="retryQuiz">重做练习</button></section>'+questions.map((q,i)=>'<details class="quiz-feedback"><summary>'+(record.answers[i]===q.ans?'已答对':'需要复习')+' · '+esc(q.q)+'</summary><p>正确答案：'+esc(q.opts[q.ans])+'</p><p>'+esc(q.exp)+'</p></details>').join(''));
  document.getElementById('retryQuiz').onclick=resetPractice;hint.textContent=course.games.length?'下一步用实训巩固本课知识。':'已完成本课练习。';buttonState(course.games.length?'进入维修实训':'查看学习结果',()=>setStage(2));return;
 }
 const index=Math.max(0,Math.min(record.question,questions.length-1)),q=questions[index],answer=record.answers[index];
 const block=document.createElement('section');block.className='quiz-question';
 block.innerHTML='<p class="question-progress">第 '+(index+1)+' / '+questions.length+' 题</p><h2>'+esc(q.q)+'</h2>'+(course.builder&&/图中|图示|图内/.test(q.q)?model():'')+'<div class="quiz-options">'+q.opts.map((option,i)=>'<button class="quiz-option'+(answer!==undefined?(i===q.ans?' correct':i===answer?' incorrect':''):'')+'" data-option="'+i+'" '+(answer!==undefined?'disabled':'')+'><span>'+String.fromCharCode(65+i)+'</span><span>'+esc(option)+'</span></button>').join('')+'</div>'+(answer!==undefined?'<div class="quiz-feedback" role="status"><strong>'+(answer===q.ans?'回答正确':'这题需要复习')+'</strong><p>'+esc(q.exp)+'</p></div>':'');
 content.append(block);
 block.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>{
  const picked=+b.dataset.option;record.answers[index]=picked;if(picked!==q.ans)rememberWrong(q);save();
  block.querySelectorAll('[data-option]').forEach(option=>{option.disabled=true;const n=+option.dataset.option;option.classList.toggle('correct',n===q.ans);option.classList.toggle('incorrect',n===picked&&picked!==q.ans)});
  block.insertAdjacentHTML('beforeend','<div class="quiz-feedback" role="status"><strong>'+(picked===q.ans?'回答正确':'这题需要复习')+'</strong><p>'+esc(q.exp)+'</p></div>');hint.textContent='看完解析后继续。';next.disabled=false;
 });
 hint.textContent=answer===undefined?'请选择一个答案。':'看完解析后继续。';
 buttonState(index===questions.length-1?'查看练习成绩':'下一题',()=>{if(index===questions.length-1)record.quizReview=true;else record.question=index+1;save();content.innerHTML=steps();renderQuiz();content.scrollTop=0},answer===undefined);
 prev.textContent=index>0&&!record.quizReview?'上一题':'返回原理';prev.onclick=()=>{if(index>0&&!record.quizReview){record.question=index-1;save();content.innerHTML=steps();renderQuiz()}else setStage(0)};
}
function renderResult(){
 const correct=record.answers.filter((a,i)=>a===course.quiz[i]?.ans).length;save();title('学习结果');
 content.insertAdjacentHTML('beforeend','<section class="course-result"><p class="result-eyebrow">本课学习已完成</p><h2>'+esc(course.title)+'</h2><div class="result-metrics"><p><strong>'+correct+' / '+course.quiz.length+'</strong><span>练习答对</span></p>'+(course.games.length?'<p><strong>'+record.gameResults.filter(Boolean).length+' / '+course.games.length+'</strong><span>实训记录</span></p>':'')+'</div><p>'+(correct===course.quiz.length?'可以返回课程目录，开始下一课。':'本课仍有错题，建议重做练习巩固。')+'</p>'+(record.gameResults.some(g=>g?.demo)?'<p>实训中使用了操作演示，记录为演示完成。</p>':'')+'<button class="secondary" id="resultRetry">重做练习</button></section>');
 document.getElementById('resultRetry').onclick=resetPractice;hint.textContent='结果已保存在当前设备。';buttonState('返回课程目录',()=>location.href='/?vehicle='+vehicle+'#course');prev.textContent=course.games.length?'返回实训':'返回练习';prev.onclick=()=>setStage(names().length-2);
}
function finishTraining(data){
 if(!ensureCourseOwner())return;
 if(!courseAccessible()){render();return;}
 gameStatus='complete';const stored=CourseProgress.recordTraining(vehicle,course.partId,{level:data.level,stars:data.stars,mistakes:data.mistakes,seconds:data.seconds,demo:!!data.demo});
 if(!stored){hint.textContent='实训记录暂时未能保存。';buttonState('重试保存',()=>finishTraining(data));return;}
 record.gameResults=stored.gameResults;save();hint.textContent=data.demo?'本项已演示完成。':'本项实训已完成，记录已保存。';
 buttonState(record.gameIndex<course.games.length-1?'下一项实训':'查看学习结果',()=>{if(record.gameIndex<course.games.length-1){record.gameIndex++;save();render()}else setStage(3)});
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||!frame||event.source!==frame.contentWindow||event.data?.source!=='zhidian-repair-game')return;
 const data=event.data;if(data.level!==course.games[record.gameIndex])return;
 if(data.type==='studio:game-ready'){
  gameStatus='ready';hint.textContent='实训 '+(record.gameIndex+1)+' / '+course.games.length+' · 先阅读任务说明，再开始操作。';buttonState('开始实训',()=>frame.contentWindow.postMessage({type:'studio:game-command',action:'start'},location.origin));
 }else if(data.type==='studio:game-start'||data.type==='studio:game-progress'){
  gameStatus='running';hint.textContent='实训 '+(record.gameIndex+1)+' / '+course.games.length+' · 工序 '+Math.min(data.step+1,data.total)+' / '+data.total;buttonState('按工序完成实训',null,true);
 }else if(data.type==='studio:game-complete'){
  finishTraining(data);
 }else if(data.type==='studio:game-error'){
  gameStatus='error';if(data.reason==='learning-required'){const latest=CourseProgress.get(vehicle,course.partId,course.lessonId);record={stage:0,question:0,answers:[],quizReview:false,gameIndex:0,gameResults:[],readingPercent:0,...(latest||{})};updateProgress();hint.textContent='请先完成对应部件的原理学习与练习。';buttonState('返回部件学习',()=>setStage(0));}else if(data.reason==='progress-save-failed'&&data.result){hint.textContent='实训已完成，记录暂时未能保存。';buttonState('重试保存',()=>finishTraining(data.result));}else{hint.textContent='实训暂时无法启动。';buttonState('重新加载实训',()=>render());}
 }
});
try{
 await Promise.all(['/lessons.js','/models/courses.js','/models/pdetail.js','/models/bev-courses.js','/models/cfg-'+vehicle+'.js'].map(load));
 const lessons=window.DATA.lessons,partId=query.get('part'),lessonId=+query.get('lesson'),cfg=window.MODEL_CFG;
 const partIndex=cfg.parts.findIndex(p=>(p.id||p.b)===partId),part=cfg.parts[partIndex];
 if(lessonId){
  const l=lessons.find(x=>x.id===lessonId);if(!l)throw new Error('这门课程不存在');
  course={title:l.title.replace(/^(?:第\d+课|部件课[①-⑳])\s*/,''),description:'阅读本课讲解，完成配套练习。',body:contextualBrandBody(l.body,l.id),quiz:l.quiz||[],games:[],lessonId:l.id,lessonIds:[l.id],progressLessonIds:[l.id],partIndex:-1};
 }else{
  if(!part||part.visualOnly)throw new Error('请先从课程目录选择一门课');
  const mapping=window.MODEL_COURSES[vehicle]?.[partIndex];
  const ids=vehicle==='bev'?(partId==='inverter'?[4]:window.BEV_LESSONS[partId]||[]):mapping?.lesson?[mapping.lesson]:[];
  const matched=ids.map(id=>lessons.find(l=>l.id===id)).filter(Boolean),custom=mapping?.custom;
  const quiz=vehicle==='bev'?(window.BEV_QUIZZES[partId]||[]).map(q=>({q:q.q,opts:q.o,ans:q.a,exp:q.e})):(custom?.quiz||matched[0]?.quiz||[]);
  course={title:part.name.replace(/（.*?）/g,''),description:part.desc,body:custom?.body||contextualBrandBody(matched[0]?.body||'',matched[0]?.id),extraBody:matched.slice(1).map(l=>contextualBrandBody(l.body,l.id)).join(''),quiz,games:CourseProgress.meta(vehicle,partId)?.games||[],partId,lessonIds:ids,progressLessonIds:vehicle!=='bev'&&!custom?ids:[],partIndex,builder:part.b==='port'?'chargeport':part.b,detail:vehicle==='bev'?window.BEV_DETAILS[partId]:window.PART_DETAIL[vehicle]?.[partIndex]};
 }
 course.paid=!!course.partId||!!lessons.find(l=>l.id===course.lessonId&&l.title.includes('部件课'));
 document.getElementById('backCourse').href='/?vehicle='+vehicle+'#course';
 const accessAtOpen=courseAccessible(),ownerAtOpen=window.DemoBilling?.owner();
 const refreshAccess=()=>{if(window.DemoBilling?.owner()!==ownerAtOpen||courseAccessible()!==accessAtOpen)location.reload()};
 document.addEventListener('demo-billing:change',refreshAccess);window.addEventListener('focus',refreshAccess);
 const onSessionChange=event=>{if(event.key==='et_session')location.reload()};window.addEventListener('storage',onSessionChange);
 if(!accessAtOpen){DemoAccess.mountLearnGate(course.title);window.__LEARN_READY=true;}
 else{
 courseInfo=CourseProgress.meta(vehicle,course.partId,course.lessonId);storageKey=CourseProgress.key(vehicle,course.partId,course.lessonId);
 const saved=CourseProgress.get(vehicle,course.partId,course.lessonId);
 record={stage:0,question:0,answers:[],quizReview:false,gameIndex:0,gameResults:[],readingPercent:0,...(saved||{})};
 if(!Array.isArray(record.answers))record.answers=[];if(!Array.isArray(record.gameResults))record.gameResults=[];
 record.learningCompleted=learningDone();
 if(query.has('step')&&/^\d$/.test(query.get('step')))record.stage=+query.get('step');
 record.stage=guardStage(record.stage);record.gameIndex=Math.max(0,Math.min(record.gameIndex,Math.max(0,course.games.length-1)));
 const safeUrl=new URL(location.href);if(safeUrl.searchParams.has('step')){safeUrl.searchParams.set('step',record.stage);history.replaceState({stage:record.stage},'',safeUrl)}
 document.getElementById('backCourse').href='/?vehicle='+vehicle+'#course';document.getElementById('courseTitle').tabIndex=-1;save();render();window.__LEARN_READY=true;
 window.addEventListener('storage',event=>{if(event.key==='et_session')location.reload();else if(event.key===storageKey){mergeProgress(CourseProgress.get(vehicle,course.partId,course.lessonId));updateProgress();}});
 history.replaceState({stage:record.stage},'',location.href);window.addEventListener('popstate',event=>{const step=Number.isInteger(event.state?.stage)?event.state.stage:+(new URLSearchParams(location.search).get('step')||'0');record.stage=guardStage(step);save();render()});
 window.learningStudio={get course(){return course},get progress(){return record},get gameStatus(){return gameStatus}};
 }
}catch(error){content.classList.remove('game-mode');content.innerHTML='<div class="error-state"><h2>课程暂时无法打开</h2><p>'+esc(error.message)+'</p><a href="/#course">返回课程目录</a></div>';prev.hidden=true;hint.textContent='';buttonState('返回课程目录',()=>location.href='/?vehicle='+vehicle+'#course');console.error(error)}
