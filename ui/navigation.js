/* A single, predictable exit for focused learning pages. */
(function(){
  if(window.top!==window.self||new URLSearchParams(location.search).get('embed')==='1')return;
  var path=location.pathname,q=new URLSearchParams(location.search);
  if(path==='/videos/nev3d.html'){location.replace(q.get('part')?'/learn.html?vehicle=bev&part='+encodeURIComponent(q.get('part'))+(q.get('mode')==='quiz'?'&step=1':''):'/#course');return;}
  if(path==='/models/quiz.html'){location.replace('/?vehicle='+encodeURIComponent(q.get('m')||'bev')+'#course');return;}
  if(path==='/models/part.html'){var legacyVehicle=['bev','phev','erev','fcev'].includes(q.get('m'))?q.get('m'):'phev';var cfgScript=document.createElement('script');cfgScript.src='/models/cfg-'+legacyVehicle+'.js';cfgScript.onload=function(){var p=window.MODEL_CFG?.parts[+(q.get('p')||0)];location.replace(p?'/learn.html?vehicle='+legacyVehicle+'&part='+encodeURIComponent(p.id||p.b):'/?vehicle='+legacyVehicle+'#course')};document.head.append(cfgScript);return;}
  function safe(value){try{var u=new URL(value,location.origin);return u.origin===location.origin&&/^\/(?:models\/|videos\/(?:nev3d|repair-game)\.html|teacher\.html|$)/.test(u.pathname)?u.pathname+u.search+u.hash:null}catch(e){return null}}
  function current(){return location.pathname+location.search+location.hash}
  document.addEventListener('click',function(event){
    var a=event.target.closest('a[href]');if(!a||a.closest('.global-navigation')||a.hasAttribute('download'))return;
    var u;try{u=new URL(a.href,location.origin)}catch(e){return}
    if(u.origin!==location.origin||!/^\/(?:models\/(?:part|quiz)\.html|videos\/(?:nev3d|repair-game)\.html)$/.test(u.pathname))return;
    if(!u.searchParams.has('returnTo')){var from=current();if(from.length<2000){u.searchParams.set('returnTo',from);a.href=u.href;}}
  },true);
  if(document.body.classList.contains('studio-app'))return;
  var isModel=/^\/models\/(bev|phev|erev|fcev)\.html$/.test(path);
  var fallback=isModel?'/#models':path==='/teacher.html'?'/#home':'/#course';
  var parent=safe(q.get('returnTo'))||fallback;
  // Course readers always exit to the course list, unless opened from a lesson or exercise.
  if(parent===current())parent=fallback;
  var css=document.createElement('link');css.rel='stylesheet';css.href='/ui/navigation.css';document.head.append(css);
  document.body.classList.add('has-global-navigation');
  if(isModel)document.body.classList.add('global-model-page');
  var header=document.createElement('header');header.className='global-navigation';
  var back=document.createElement('a');back.className='global-back';back.href=parent;
  back.textContent='← '+(parent.indexOf('/#models')===0?'返回拆解看板':parent.indexOf('/#home')===0?'返回学习总览':parent.indexOf('/#course')===0?'返回课程':'返回上一页');
  var title=document.createElement('span');title.className='global-page-title';
  var mode=document.createElement('span');mode.className='global-focus-label';mode.textContent=isModel?'结构探索':'专注学习';
  header.append(back,title,mode);document.body.prepend(header);
  window.studioGlobalBack=function(){location.href=parent};
  function update(){var text=isModel?(window.vehicleStudio?.profile?.name||document.getElementById('typeTitle')?.textContent||window.MODEL_CFG?.title):path==='/models/part.html'?document.getElementById('pName')?.textContent:path==='/models/quiz.html'?'部件知识练习':path==='/videos/repair-game.html'?'维修实训':path==='/teacher.html'?'教师工作台':q.get('mode')==='quiz'?'随堂考核':document.querySelector('#root h1')?.textContent||'部件课程';if(title.textContent!==text)title.textContent=text||'课程学习';}
  update();var timer;new MutationObserver(function(records){if(records.every(function(r){return header.contains(r.target)}))return;clearTimeout(timer);timer=setTimeout(update,80)}).observe(document.body,{subtree:true,childList:true});
})();
