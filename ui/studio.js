/*
 * Homepage feature icons: Lucide box, book-open, activity and file-text.
 * Source: https://github.com/lucide-icons/lucide/tree/c29c276f16590cf017126671535ad8c792be64d8/icons
 * The existing motor/battery/diagnostic/car markup aliases are retained.
 * ISC License — Copyright (c) 2026 Lucide Icons and Contributors
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
/* Small presentation and accessibility layer; learning logic remains in the existing pages. */
(function(){
  var paths={
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    cube:'<path d="m12 2 9 5v10l-9 5-9-5V7Z"/><path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5"/>',
    book:'<path d="M12 5c-3-3-8-3-10-1v15c3-2 7-2 10 0 3-2 7-2 10 0V4c-2-2-7-2-10 1Zm0 0v14"/>',
    tool:'<path d="M14 6a6 6 0 0 0-7 7L2 18a3 3 0 0 0 4 4l6-6a6 6 0 0 0 7-8l-4 4-4-4 4-4Z"/>',
    file:'<path d="M14 2H5a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8Z"/><path d="M14 2v6h6M8 12h8M8 16h8"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 10h18M7 14h3M7 17h7"/>',
    chart:'<path d="M3 21h19M5 17V9h3v8M11 17V3h3v14M17 17v-5h3v5"/>',
    review:'<path d="M4 3h16v18H4ZM8 7h8M8 11h5M8 15h2m3 2 2 2 4-5"/>',
    download:'<path d="M12 2v13m-5-5 5 5 5-5M3 16v5h18v-5"/>',
    users:'<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a3 3 0 0 1 0 6m3 11v-3a7 7 0 0 0-3-5"/>',
    user:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    shield:'<path d="m12 2 9 4v7c0 5-9 9-9 9s-9-4-9-9V6Zm-4 9 3 3 5-5"/>',
    menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
    info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/>',
    route:'<circle cx="6" cy="4" r="2"/><circle cx="18" cy="20" r="2"/><path d="M8 4h8a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h8"/>',
    motor:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    battery:'<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>',
    diagnostic:'<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
    car:'<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'
  };
  window.studioIcon=function(name){return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">'+(paths[name]||paths.cube)+'</svg>'};
  function enhance(root){
    if(!root||!root.querySelectorAll)return;
    root.querySelectorAll('[data-icon]:not([data-icon-ready])').forEach(function(el){el.innerHTML=studioIcon(el.dataset.icon);el.dataset.iconReady='1'});
    root.querySelectorAll('div[onclick],span[onclick],.lesson[style*="cursor: pointer"],.lesson[style*="cursor:pointer"]').forEach(function(el){
      if(!el.hasAttribute('tabindex')){el.tabIndex=0;el.setAttribute('role','button')}
    });
    // Runtime-generated legacy cards use onclick properties rather than attributes.
    root.querySelectorAll('.card,.case,.lesson').forEach(function(el){
      if(typeof el.onclick==='function'&&!el.hasAttribute('tabindex')){el.tabIndex=0;el.setAttribute('role','button')}
    });
  }
  enhance(document);
  var pending=false;
  new MutationObserver(function(){
    if(pending)return;pending=true;
    requestAnimationFrame(function(){pending=false;enhance(document)})
  }).observe(document.body,{subtree:true,childList:true});
  document.addEventListener('keydown',function(e){
    var target=e.target;
    if((e.key==='Enter'||e.key===' ')&&target.matches('[role="button"]:not(button)')&&target===document.activeElement){e.preventDefault();target.click()}
  });
  if(!document.body.classList.contains('studio-app'))return;
  var titles={models:'3D 拆解台',home:'学习总览',course:'体系课程',trainer:'故障带教',cases:'案例库',exam:'考证备考',dash:'学习看板',wrong:'我的错题',app:'安装到桌面'};
  var menu=document.querySelector('.menu-toggle'),sidebar=document.getElementById('sidebar'),mobile=matchMedia('(max-width:760px)');
  function syncSidebar(){sidebar.inert=mobile.matches&&!document.body.classList.contains('menu-open')}
  function closeMenu(restoreFocus){var wasOpen=document.body.classList.contains('menu-open');document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','展开导航');syncSidebar();if(wasOpen&&restoreFocus)menu.focus()}
  menu.addEventListener('click',function(){
    if(document.body.classList.contains('menu-open')){closeMenu(true);return}
    document.body.classList.add('menu-open');menu.setAttribute('aria-expanded','true');menu.setAttribute('aria-label','收起导航');syncSidebar();
    (sidebar.querySelector('button.active')||sidebar.querySelector('a,button')).focus();
  });
  mobile.addEventListener('change',function(){closeMenu(false)});syncSidebar();
  document.addEventListener('click',function(e){if(document.body.classList.contains('menu-open')&&!e.target.closest('.studio-sidebar,.menu-toggle'))closeMenu()});
  var descriptions={models:'切换动力车型，旋转观察结构；点击标注查看部件说明。',home:'',course:'从结构与高压安全开始，再按车型学习部件；学习和实训进度会分别保存。',trainer:'从症状出发，通过读码、推断、排查与验证建立诊断思路。',cases:'从故障现象走到根因，先学对应部件，再进入实训。',exam:'选择证书，系统学习知识，再通过练习与模拟检验掌握情况。',dash:'查看课程、实训和考试进度，找到下一步学习重点。',wrong:'重练薄弱知识点；答对后自动移出，反复出错的题优先显示。',app:'在电脑、手机和平板上，把学习平台添加到常用位置。'};
  titles.app='安装应用';
  window.studioViewToken=0;
  var originalCourseRenderer=window.renderLessons,originalGo=window.go,routing=false,current={path:'#home',parent:null,breadcrumbs:[{label:titles.home,href:'/#home'}]},resultViews={};
  function base(section){return {section:section,path:'#'+section,parent:section==='home'?null:'#home',title:titles[section],description:descriptions[section],crumbs:section==='home'?[]:[{label:titles[section],href:'/#'+section}]}}
  function view(section,path,title,parent,description,crumbs){var v=base(section);v.path='#'+path;v.title=title;v.parent=parent;v.description=description||v.description;v.crumbs=v.crumbs.concat(crumbs||[{label:title,href:'/#'+path}]);return v}
  function lessonView(index,quiz){var L=LESSONS[index];if(!L)return base('course');return view('course','course/'+(quiz?'quiz/':'lesson/')+L.id,quiz?'随堂考核':L.title,(quiz?'#course/lesson/'+L.id:(isPartL(L)?'#course/vehicles':'#course/theory')),quiz?'完成考核，检验知识点是否掌握。':'阅读知识点后完成随堂考核，学习进度会自动保存。',[{label:isPartL(L)?'部件课程':'理论课程',href:'/#course'},{label:L.title,href:'/#course/lesson/'+L.id}].concat(quiz?[{label:'随堂考核',href:'/#course/quiz/'+L.id}]:[]))}
  function bankView(id,mode,title){var b=BANKS.filter(function(b){return b.id===id})[0];if(!b)return base('exam');var path='exam/bank/'+id;return view('exam',path+(mode?'/'+mode:''),title||b.name,mode?'#'+path:'#exam',mode?'按题目要求作答，练习结果会记录到学习看板。':b.desc,[{label:b.name,href:'/#'+path}].concat(mode?[{label:title,href:'/#'+path+'/'+mode}]:[]))}
  function applyView(v,replace){
    var crumbs=[{label:titles.home,href:'/#home'}].concat(v.crumbs||[]);
    current={path:v.path,parent:v.parent,breadcrumbs:crumbs,section:v.section,title:v.title};
    var hash=v.path;if(location.hash!==hash)history[replace?'replaceState':'pushState']({studio:true,path:hash},'',hash);
    document.getElementById('routeBreadcrumbs').innerHTML='<span class="current" id="currentPage">'+esc(titles[v.section])+'</span>';
    document.title=v.title+' · 智电汽修';
    document.querySelectorAll('.nav [data-p]').forEach(function(btn){var active=btn.dataset.p===v.section;btn.classList.toggle('active',active);if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current')});
    var page=document.getElementById('p-'+v.section),heading=page.querySelector('.page-header .sec'),desc=page.querySelector('.page-description'),back=page.querySelector('.section-back');
    if(heading)heading.textContent=v.title;if(desc)desc.textContent=v.description;
    if(back){back.closest('.view-navigation').hidden=v.path==='#'+v.section;var previous=crumbs.filter(function(c){return c.href==='/'+v.parent})[0]||crumbs[crumbs.length-2];back.querySelector('span:last-child').textContent=previous?previous.label:titles.home;page.querySelector('.view-context').textContent=v.path.split('/').length>1?'继续学习':'学习中心'}
    document.getElementById('courseActions').hidden=v.path!=='#course';
    document.getElementById('courseOverview').hidden=v.section==='course'&&v.path!=='#course';
    document.querySelector('#p-course .course-textbooks').hidden=v.section==='course'&&v.path!=='#course';
    document.getElementById('caseFilters').hidden=v.section==='cases'&&v.path!=='#cases';
    document.querySelector('#p-exam>.notice').hidden=v.section==='exam'&&v.path!=='#exam';
    var stages=document.querySelectorAll('.journey-strip li'),stage=v.path.indexOf('/quiz/')>=0||v.path.indexOf('/assessment/')>=0?4:v.path.indexOf('/lesson/')>=0||v.path==='#course/theory'?2:v.path==='#course/vehicles'?1:0;
    stages.forEach(function(li,i){li.classList.toggle('current',i===stage);if(i===stage)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')});
    document.dispatchEvent(new CustomEvent('studio:navigation',{detail:window.studioLocation()}));
    page.querySelectorAll('button[onclick]').forEach(function(b){if(/^←?\s*返回/.test(b.textContent)&&b.closest('#examBox,#lessonList,#wrongBox'))b.remove()});
    enhance(page);
  }
  function leaveMock(next){if(window.mock&&current.path.indexOf('/mock')>=0&&next!==current.path){if(!confirm('退出全真模拟？未交卷的成绩将作废。'))return false;clearInterval(mockTimer);mock=null}return true}
  function route(path,replace){
    var hash=(path||'#home').split('#')[1]||'home';if(hash==='course/models')hash='models';if(hash==='course/vehicles')hash='course';var openFoundations=hash==='course/theory';if(openFoundations)hash='course';var parts=hash.split('/');if(parts[0]==='course'&&(parts[1]==='lesson'||parts[1]==='quiz')&&LESSONS.some(function(L){return String(L.id)===parts[2]})){location.href=courseLearnUrl(courseVehicle,null,+parts[2]);return true}var section=titles[parts[0]]?parts[0]:'home';
    var target='#'+hash;if(!leaveMock(target))return false;if(current.path!==target&&current.path.indexOf('#course/lesson/')===0)stopStudyTimer(true);
    routing=true;window.studioViewToken++;
    try{
      if(resultViews[target]){var saved=resultViews[target];document.querySelectorAll('.page').forEach(function(p){p.classList.toggle('active',p.id==='p-'+saved.view.section)});document.getElementById(saved.box).innerHTML=saved.html;applyView(saved.view,replace);closeMenu();window.scrollTo(0,0);return true}
      originalGo(section);var v=base(section),a=parts[1],id=parts[2];
      if(section==='course'){
        if(a==='vehicles'){window.renderPartsVehicle();v=view('course','course/vehicles','部件学习 · 选择车型','#course','选择车型后进入整车结构、部件原理与对应实训。')}
        if(a==='theory'){window.renderTheoryList();v=view('course','course/theory','理论课程','#course','从基础概念到故障诊断，选择知识点继续学习。')}
        if(a==='lesson'||a==='quiz'){var i=LESSONS.findIndex(function(L){return String(L.id)===id});if(i>=0){if(a==='quiz')window.startQuiz(i);else if(isPartL(LESSONS[i]))window.openLesson(i);else window.openTheoryLesson(i);v=lessonView(i,a==='quiz')}}
        if(a==='placement'){window.startPlacement();v=view('course','course/placement','学习能力定位','#course','完成理论与实训考核，按已有能力安排学习。')}
        if(a==='assessment'&&EXAMS[+id]){window.startCourseExam(+id);v=view('course','course/assessment/'+id,EXAMS[+id].name||'阶段考核','#course/theory')}
      }else if(section==='cases'){
        if(a==='view'&&CASES[+id]){window.openCase(+id);v=view('cases','cases/view/'+id,CASES[+id].t,'#cases','按诊断、维修和复盘顺序阅读，再学习对应部件与实训。')}
        if(a==='mine'&&getUserCases().some(function(c){return String(c.id)===id})){window.openUserCase(+id);v=view('cases','cases/mine/'+id,'我的带教记录','#cases')}
      }else if(section==='exam'&&a==='bank'&&BANKS.some(function(b){return b.id===id})){
        window.openBank(id);v=bankView(id);var mode=parts[3];
        var actions={study:['renderStudy','教材学习路线'],mock:['startMock','全真模拟'],quick:['startExam','快速抽考'],drill:['drill','顺序刷题'],wrong:['drillWrong','错题重练'],skills:['startGameQuiz','维修实操考题'],practical:['startPractical','看图实操']};
        if(actions[mode]){window[actions[mode][0]](mode==='study'?id:0);v=bankView(id,mode,actions[mode][1])}
      }else if(section==='wrong'&&a==='practice'){window.startWrongPractice();v=view('wrong','wrong/practice','错题强化练习','#wrong')}
      applyView(v,replace);closeMenu();window.scrollTo(0,0);if(openFoundations){var group=document.getElementById('foundationCourses');if(group){group.open=true;group.scrollIntoView({block:'start'})}}return true;
    }finally{routing=false}
  }
  window.studioNavigate=function(path){var url=new URL(path||'/#home',location.href);if(url.origin===location.origin&&(url.pathname==='/'||url.pathname==='/index.html')){var vehicle=url.searchParams.get('vehicle');if(COURSE_CATALOG[vehicle])rememberCourseVehicle(vehicle);return route(url.hash||'#home')};location.href=url.href};
  window.studioResult=function(){var section=current.section,box={course:'lessonList',exam:'examBox',wrong:'wrongBox'}[section];if(!box)return;var path=current.path+'/result',v=view(section,path.slice(1),'学习结果',current.parent,'查看结果与解析，继续巩固薄弱知识点。',current.breadcrumbs.slice(2).concat([{label:'学习结果',href:'/'+path}]));resultViews[path]={view:v,box:box,html:document.getElementById(box).innerHTML};applyView(v);window.scrollTo(0,0)};
  window.studioBack=function(){if(current.parent)route(current.parent)};
  window.studioLocation=function(){return {path:current.path,parent:current.parent,breadcrumbs:current.breadcrumbs.map(function(c){return {label:c.label,href:c.href}})}};
  window.go=function(p){if(!titles[p])return;var fromMobileMenu=mobile.matches&&document.body.classList.contains('menu-open');if(route('#'+p)&&fromMobileMenu){var h=document.querySelector('#p-'+p+' h1,#p-'+p+' .sec');if(h){h.tabIndex=-1;h.focus({preventScroll:true})}}};
  function wrap(name,descriptor){var original=window[name];if(typeof original!=='function')return;window[name]=function(){var args=[].slice.call(arguments);if(name==='openLesson'||name==='openTheoryLesson'||name==='startQuiz'){var lesson=LESSONS[args[0]];if(lesson)location.href=courseLearnUrl(courseVehicle,null,lesson.id);return}if(routing)return original.apply(this,args);var v=descriptor.apply(null,args);if(!v)return original.apply(this,args);if(!leaveMock(v.path))return;if(current.path!==v.path&&current.path.indexOf('#course/lesson/')===0)stopStudyTimer(true);routing=true;window.studioViewToken++;try{var result=original.apply(this,args);if(!document.getElementById('p-'+v.section).classList.contains('active')){document.querySelectorAll('.page').forEach(function(p){p.classList.toggle('active',p.id==='p-'+v.section)})}applyView(v);window.scrollTo(0,0);return result}finally{routing=false}}}
  wrap('renderPartsVehicle',function(){return base('course')});
  wrap('renderTheoryList',function(){return base('course')});
  wrap('openTheoryLesson',function(i){return lessonView(i)});wrap('openLesson',function(i){return lessonView(i)});wrap('startQuiz',function(i){var v=lessonView(i,true);v.parent='#course/lesson/'+LESSONS[i].id;return v});
  wrap('startPlacement',function(){return view('course','course/placement','学习能力定位','#course')});
  wrap('startCourseExam',function(i){return view('course','course/assessment/'+i,EXAMS[i].name||'阶段考核','#course/theory')});
  wrap('renderCases',function(){return base('cases')});
  wrap('openCase',function(i){return view('cases','cases/view/'+i,CASES[i].t,'#cases','按诊断、维修和复盘顺序阅读，再学习对应部件与实训。')});
  wrap('openUserCase',function(id){return view('cases','cases/mine/'+id,'我的带教记录','#cases')});
  wrap('renderExamHome',function(){return base('exam')});wrap('openBank',function(id){return bankView(id)});
  wrap('renderStudy',function(id){return bankView(id,'study','教材学习路线')});
  [['startMock','mock','全真模拟'],['startExam','quick','快速抽考'],['drill','drill','顺序刷题'],['drillWrong','wrong','错题重练'],['startGameQuiz','skills','维修实操考题'],['startPractical','practical','看图实操']].forEach(function(x){wrap(x[0],function(){return CURB?bankView(CURB.id,x[1],x[2]):null})});
  wrap('renderWrong',function(){return base('wrong')});wrap('startWrongPractice',function(){return view('wrong','wrong/practice','错题强化练习','#wrong')});
  document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(!a||e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||a.target==='_blank')return;var url=new URL(a.href,location.href);if(url.origin===location.origin&&(url.pathname==='/'||url.pathname==='/index.html')&&/^#(home|models|course|trainer|cases|exam|dash|wrong|app)(\/|$)/.test(url.hash)){e.preventDefault();window.studioNavigate(url.href)}});
  window.addEventListener('popstate',function(){var target=location.hash||'#home';if(target==='#mainContent')return;if(!route(target,true))history.pushState({studio:true,path:current.path},'',current.path)});
  function refreshCourseProgress(){
    if(current.path!=='#course'||routing)return;
    var groups=[].slice.call(document.querySelectorAll('.foundation-part')),opened=groups.map(function(group){return group.open}),focusable=document.querySelectorAll('#courseOverview summary,#courseOverview a[href]'),focusIndex=[].indexOf.call(focusable,document.activeElement),x=window.scrollX,y=window.scrollY;
    originalCourseRenderer();
    document.querySelectorAll('.foundation-part').forEach(function(group,i){group.open=!!opened[i]});
    if(focusIndex>=0){var next=document.querySelectorAll('#courseOverview summary,#courseOverview a[href]')[focusIndex];if(next)next.focus({preventScroll:true})}
    window.scrollTo({left:x,top:y,behavior:'instant'});
  }
  window.addEventListener('pageshow',function(e){if(e.persisted)refreshCourseProgress()});
  window.addEventListener('storage',function(e){if(e.key===null||e.key.indexOf('et_courseflow:')===0)refreshCourseProgress()});
  window.addEventListener('hashchange',function(){if(location.hash!=='#mainContent'&&location.hash!==current.path)route(location.hash,true)});
  document.getElementById('dashActions').innerHTML='<button class="btn gray" onclick="exportData()">导出学习档案</button>';
  var modelFrame=document.getElementById('modelFrame'),modelProfileInfo=document.getElementById('modelProfileInfo'),modelSwitch=document.getElementById('modelSwitch'),modelProfiles={},currentModelId='generic-bev';
  var modelLabels={'generic-bev':'通用纯电','generic-phev':'通用插混','generic-erev':'通用增程','generic-fcev':'通用氢燃料','su7-rwd-2024':'小米 SU7','atto3-fwd-2023':'BYD ATTO 3','model3-rwd-2023':'Tesla Model 3','xc60-t8-er-2022':'Volvo XC60 T8','li-l7-2023':'理想 L7','mirai-gen2-2021':'Toyota Mirai','nexo-2018':'Hyundai NEXO'};
  descriptions.models='选择通用模型或具体车型，直接查看对应的配件与内部结构。';
  function modelProfileNode(tag,text){var node=document.createElement(tag);if(text)node.textContent=text;return node}
  function showModelProfile(id){
    var profile=modelProfiles[id];if(!profile)return;
    if(currentModelId===id&&modelProfileInfo.dataset.profile===id)return;
    currentModelId=id;var generic=id.indexOf('generic-')===0;
    modelSwitch.querySelectorAll('[data-profile]').forEach(function(button){var active=button.dataset.profile===id;button.classList.toggle('on',active);button.setAttribute('aria-pressed',String(active))});
    var src='/models/'+profile.powertrain+'.html?profile='+encodeURIComponent(id)+'&embed=1&explore=1&shell=xray';if(modelFrame.getAttribute('src')!==src)modelFrame.src=src;
    modelFrame.title=profile.name+' · '+(generic?'全配件教学拆解台':profile.year+' · 车型结构拆解台');modelProfileInfo.dataset.profile=id;
    modelProfileInfo.replaceChildren(modelProfileNode('h3',generic?profile.name+' · 全配件模型':profile.year+' · '+profile.name),modelProfileNode('p',profile.shellScope));
    var layout=modelProfileNode('ul');layout.className='model-profile-layout';profile.confirmedLayout.forEach(function(text){layout.append(modelProfileNode('li',text))});modelProfileInfo.append(layout);
    var scope=modelProfileNode('p',profile.scope);scope.className='model-profile-scope';modelProfileInfo.append(scope);
    if(profile.sources.length){
      var details=modelProfileNode('details'),list=modelProfileNode('ul');details.className='model-profile-sources';details.append(modelProfileNode('summary','车型资料与已确认位置'));
      profile.sources.forEach(function(source){var item=modelProfileNode('li'),link=modelProfileNode('a',source.title);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';item.append(link);if(source.details)item.append(modelProfileNode('span',source.details));list.append(item)});details.append(list);modelProfileInfo.append(details);
    }
  }
  modelSwitch.addEventListener('click',function(event){var button=event.target.closest('[data-profile]');if(button&&modelSwitch.contains(button))showModelProfile(button.dataset.profile)});
  Promise.all([import('/models/generic-profiles.js'),import('/models/vehicle-profiles.js')]).then(function(apis){
    modelProfiles=Object.assign({},apis[0].GENERIC_VEHICLE_PROFILES,apis[1].VEHICLE_PROFILES);
    modelSwitch.replaceChildren();Object.values(modelProfiles).forEach(function(profile){
      var generic=profile.id.indexOf('generic-')===0,button=modelProfileNode('button');button.className='model-choice';button.dataset.profile=profile.id;button.type='button';button.title=profile.year+' · '+profile.name;button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed','false');
      button.append(modelProfileNode('strong',modelLabels[profile.id]||profile.name),modelProfileNode('span',(generic?'完整配件':'车型')+' · '+profile.powertrain.toUpperCase()));modelSwitch.append(button);
    });showModelProfile(currentModelId);
  }).catch(function(){modelProfileInfo.replaceChildren(modelProfileNode('p','模型列表暂时无法读取，请刷新页面重试。'))});
  route(location.hash||'#home',true);
  var chip=document.getElementById('userChip');
  function sessionStatus(){var u=typeof curUser==='function'?curUser():null;document.getElementById('sessionStatus').textContent=u?'已登录':'游客模式';var text=chip.textContent.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u26FF\uFE0F]/gu,'').trim();if(text!==chip.textContent)chip.textContent=text}
  new MutationObserver(sessionStatus).observe(chip,{childList:true,subtree:true,characterData:true});sessionStatus();
  var auth=document.getElementById('authMask'),returnFocus=null,open=window.openAuth,close=window.closeAuth;
  window.openAuth=function(){if(!auth.classList.contains('show'))returnFocus=document.activeElement;open();document.getElementById('aUser').focus()};
  window.closeAuth=function(){close();if(returnFocus&&returnFocus.focus)returnFocus.focus()};
  if(!curUser())chip.onclick=window.openAuth;
  auth.addEventListener('click',function(e){if(e.target===auth)closeAuth()});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){if(auth.classList.contains('show'))closeAuth();if(document.getElementById('installMask').classList.contains('show'))closeInstallGuide();closeMenu(true)}
    if(e.key==='Tab'&&auth.classList.contains('show')){
      var nodes=[].slice.call(auth.querySelectorAll('button,input,a[href]')).filter(function(el){return !el.disabled&&el.offsetParent!==null}),first=nodes[0],last=nodes[nodes.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    }else if(e.key==='Tab'&&document.getElementById('installMask').classList.contains('show')){
      var install=document.getElementById('installMask'),buttons=[].slice.call(install.querySelectorAll('button,a[href]')),a=buttons[0],z=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
    }else if(e.key==='Tab'&&mobile.matches&&document.body.classList.contains('menu-open')){
      var links=sidebar.querySelectorAll('a[href],button'),firstLink=links[0],lastLink=links[links.length-1];
      if(e.shiftKey&&document.activeElement===firstLink){e.preventDefault();lastLink.focus()}else if(!e.shiftKey&&document.activeElement===lastLink){e.preventDefault();firstLink.focus()}
    }
  });
})();
