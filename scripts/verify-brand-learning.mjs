// Static checks: node scripts/verify-brand-learning.mjs
// Real DOM/model checks: set UI_QA_SPACE and UI_QA_PAGE to an assigned existing Ego Lite page.
// Add UI_QA_MAIN_ONLY=1 for the unified workbench, or UI_QA_GENERIC_ONLY=1 while brand assets are being updated.
// The browser mode reuses an explicitly assigned Ego Lite space and restores its
// temporary account/session data. It never answers questions or completes a course.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(path.join(root,name),'utf8');
const ui=await import('data:text/javascript;base64,'+Buffer.from(read('ui/brand-comparisons.js')).toString('base64'));
const profileModuleURL='data:text/javascript;base64,'+Buffer.from(read('models/vehicle-profiles.js')).toString('base64');
const genericModuleURL='data:text/javascript;base64,'+Buffer.from(read('models/generic-profiles.js')).toString('base64');
const genericAPI=await import(genericModuleURL);
const profileAPI=await import(profileModuleURL);
const profileIds=['su7-rwd-2024','atto3-fwd-2023','model3-rwd-2023','xc60-t8-er-2022','li-l7-2023','mirai-gen2-2021','nexo-2018'];
assert.deepEqual(Object.keys(profileAPI.VEHICLE_PROFILES),profileIds,'Seven supported year-specific whole-vehicle profiles');
for(const id of profileIds){const profile=profileAPI.getVehicleProfile(id);assert.equal(profile.id,id);assert(profile.year&&profile.shellScope&&profile.scope);assert(profile.confirmedLayout.length&&profile.sources.length);for(const source of profile.sources)assert.equal(new URL(source.url).protocol,'https:');assert(profile.parts.length>0)}
for(const [powertrain,id] of Object.entries(profileAPI.DEFAULT_VEHICLE_PROFILES))assert.equal(profileAPI.getVehicleProfile(id).powertrain,powertrain,'Default profile matches route');
assert.equal(profileAPI.getVehicleProfile('unknown'),null,'Unknown versions never silently use another vehicle');
const visualSource=read('ui/lesson-visuals.js').replace("'../models/vehicle-profiles.js'",JSON.stringify(profileModuleURL)).replace("'../models/generic-profiles.js'",JSON.stringify(genericModuleURL));
const visuals=await import('data:text/javascript;base64,'+Buffer.from(visualSource).toString('base64'));
assert.equal(Object.keys(visuals.WHOLE_VEHICLE_OPTIONS).length,11,'Four complete generic layouts and seven evidence-scoped brand profiles coexist');
const indexSource=read('index.html');
assert(!/id=["'](?:modelViewMode|modelCompareView)["']/.test(indexSource),'Main workbench has no separate comparison mode');
assert.equal((indexSource.match(/id=["']modelFrame["']/g)||[]).length,1,'Main workbench declares one persistent model canvas');
for(const type of ['bev','phev','erev','fcev']){const profile=genericAPI.getGenericVehicleProfile(type);assert.equal(profile.id,'generic-'+type);assert.equal(profile.powertrain,type);assert.equal(profile.sources.length,0);assert(!/SU7|XC60|Tesla|Mirai|NEXO|小米|理想/.test(profile.name+profile.shellScope+profile.scope))}
const original=execFileSync('git',['show','ab2bcf8:videos/nev3d.js'],{cwd:root,encoding:'utf8',maxBuffer:40*1024*1024});
const start=original.indexOf('Hs={'),end=original.indexOf(',$C=',start);
assert(start>=0&&end>start,'Original brand records are available');
const legacy=vm.runInNewContext('('+original.slice(start+3,end)+')');
const plain=value=>JSON.parse(JSON.stringify(value));
assert.deepEqual(plain(ui.LEGACY_BRANDS),plain(legacy),'All original five-brand fields remain available for provenance');
assert.equal(Object.keys(ui.LEGACY_BRANDS).length,5);
assert.equal(Object.keys(ui.BRAND_VARIANTS).length,12);
const componentSource=read('models/component-variants.js');
const metadata=componentSource.slice(componentSource.indexOf('const SOURCE ='),componentSource.indexOf('\nfunction mesh(')).replace('export const COMPONENT_VARIANTS =','globalThis.COMPONENT_VARIANTS =');
const context=vm.createContext({});vm.runInContext(metadata,context);
for(const [id,variant]of Object.entries(ui.BRAND_VARIANTS)){
  assert(context.COMPONENT_VARIANTS[id]?.parts.includes(variant.part),id+' matches the model API');
  assert(variant.sources.length,id+' has primary source references');
  for(const source of variant.sources)assert(new URL(ui.BRAND_SOURCES[source].url).protocol==='https:');
}
for(const id of ['byd-pmsm','huawei-driveone'])for(const part of ['inverter','reducer','obc','dcdc','pdu'])assert(context.COMPONENT_VARIANTS[id].parts.includes(part),id+' supports integrated '+part+' observation');
for(const lessonId of [1,3,5,7])assert(ui.brandComparisonConfig({lessonId}),'Original platform lesson '+lessonId+' has comparison context');
for(const lessonId of [1,3,7,27,50]){assert.equal(visuals.LESSON_VISUALS[lessonId].kind,'whole');assert(ui.brandComparisonConfig({lessonId}),'Whole-vehicle and brand comparison remain available together');}
for(const partId of ['battery','motor','inverter','reducer','obc','dcdc','pdu','dht','thermal','fuelStack'])assert(ui.brandComparisonConfig({partId}));
for(const partId of ['wheel','body','h2tanks','bms'])assert.equal(ui.brandComparisonConfig({partId}),null,'Unsupported brand facts remain generic');
console.log('PASS: four unbranded complete layouts, seven whole-vehicle brand profiles, 12 component variant APIs, five complete original brand records, primary sources and course scope mappings.');

if(!process.env.UI_QA_SPACE){console.log('Browser mount/switch/cleanup checks skipped; set UI_QA_SPACE to an assigned existing space.');process.exit(0)}

const browserCheck=async(config)=>{
  const assert=(await import('node:assert/strict')).default;
  const task=await taskSpace(config.space),page=task.page(config.page),base=config.base;
  await page.cdp('Network.enable',{});await page.cdp('Network.setCacheDisabled',{cacheDisabled:true});
  await page.goto(base+'/#course');
  const fixture=await page.evaluate(()=>({session:localStorage.getItem('et_session'),user:'qa-brand-regression-'+Date.now()}));
  await page.evaluate(value=>localStorage.setItem('et_session',JSON.stringify(value)),fixture.user);
  const seen=new Set();
  const inspect=()=>page.evaluate(()=>[...document.querySelectorAll('.brand-model-card iframe')].map(frame=>({expected:new URL(frame.src).searchParams.get('variant'),actual:frame.contentWindow.componentStudio?.model?.userData?.variant?.id||frame.contentWindow.componentStudio?.variant?.id,ready:frame.contentWindow.__COMPONENT_READY,error:!!frame.contentDocument.querySelector('#modelLoading.error')})));
  async function waitModels(){await page.waitForFunction(()=>{const frames=[...document.querySelectorAll('.brand-model-card iframe')];return frames.length===2&&frames.every(frame=>{const q=new URL(frame.src).searchParams,win=frame.contentWindow,actual=win.componentStudio?.model?.userData?.variant?.id||win.componentStudio?.variant?.id;return win.__COMPONENT_READY===true&&win.location.href===frame.src&&!win.document.querySelector('#modelLoading.error')&&(q.has('variant')?actual===q.get('variant'):!actual)})});const states=await inspect();for(const state of states){assert.equal(state.ready,true);assert.equal(state.error,false);if(state.expected){assert.equal(state.actual,state.expected);seen.add(state.actual)}}}
  const stable=()=>page.evaluate(()=>{const r=learningStudio.progress,c=document.getElementById('lessonContent');return {offset:c.scrollTop,url:location.href,progress:JSON.stringify([r.stage,r.read,r.quizReview,r.answers,r.gameResults,r.learningCompleted,r.completed])}});
  try{
    await page.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await page.goto(base+'/#models');
    await page.waitForFunction(()=>document.querySelectorAll('#modelSwitch [data-profile]').length===11);
    const ids=['generic-bev','generic-phev','generic-erev','generic-fcev','su7-rwd-2024','atto3-fwd-2023','model3-rwd-2023','xc60-t8-er-2022','li-l7-2023','mirai-gen2-2021','nexo-2018'];
    assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('#modelSwitch [data-profile]')].map(button=>button.dataset.profile).sort()),[...ids].sort(),'All generic and brand profiles appear together in the main selector');
    assert.equal(await page.evaluate(()=>!!document.getElementById('modelViewMode')||!!document.getElementById('modelCompareView')),false,'No separate model/comparison mode exists in the main workbench');
    await page.evaluate(()=>{window.__mainObservationFrame=document.getElementById('modelFrame')});
    // A partial record belongs only to the isolated QA account. Browsing models
    // must preserve it byte-for-byte, including across desktop/mobile layouts.
    await page.evaluate(user=>localStorage.setItem('et_courseflow:bev:battery:'+user,JSON.stringify({stage:0,read:false,readingPercent:25,answers:[1],gameResults:[],completed:false,updatedAt:1})),fixture.user);
    const mainProgress=()=>page.evaluate(user=>JSON.stringify(Object.keys(localStorage).filter(key=>key.startsWith('et_courseflow:')&&key.endsWith(':'+user)).sort().map(key=>[key,localStorage.getItem(key)])),fixture.user);
    const progressBefore=await mainProgress();
    const wholeReady=()=>page.waitForFunction(()=>{const frames=[...document.querySelectorAll('#p-models iframe,.lesson-visuals[data-kind="whole"] iframe')];return frames.length>0&&frames.every(frame=>{const win=frame.contentWindow,id=new URL(frame.src).searchParams.get('profile');return id&&win.__STUDIO_READY===true&&win.studio?.profile?.id===id&&!win.document.querySelector('#modelLoading.error')})},undefined,{timeout:30000});
    for(const id of ids.filter(id=>id.startsWith('generic-')||!config.genericOnly)){
      await page.click('#modelSwitch [data-profile="'+id+'"]');await wholeReady();
      const state=await page.evaluate(()=>{const frame=document.getElementById('modelFrame'),win=frame.contentWindow,studio=win.studio,generic=studio.profile.id.startsWith('generic-');return {count:document.querySelectorAll('#p-models iframe').length,sameFrame:frame===__mainObservationFrame,id:studio.profile.id,active:[...document.querySelectorAll('#modelSwitch [aria-pressed="true"]')].map(button=>button.dataset.profile),geometry:generic?studio.parts.length===win.MODEL_CFG.parts.filter(part=>!part.shellPart).length&&studio.parts.every(part=>!part.group.userData.vehicleComponent):studio.parts.length>0&&studio.parts.every(part=>part.cfg.geometry&&part.group.userData.vehicleComponent),unbranded:!generic||!(/SU7|XC60|Volvo|Mirai|NEXO|小米|理想/).test(frame.title+' '+win.document.querySelector('.stage-caption').textContent),cabin:!generic||studio.shell.userData.includesCabin===true&&!!studio.shell.getObjectByName('Generic_cabin'),sources:generic||document.querySelectorAll('#modelProfileInfo a[href]').length>0}});
      assert.deepEqual(state,{count:1,sameFrame:true,id,active:[id],geometry:true,unbranded:true,cabin:true,sources:true},'Every selection uses the original single frame and the appropriate complete/dedicated geometry');
    }
    await page.evaluate(()=>{const frame=document.getElementById('modelFrame');window.__repeatModelDocument=frame.contentDocument;window.__repeatModelTime=frame.contentWindow.performance.timeOrigin;window.__repeatModelSrcChanges=0;window.__repeatModelObserver=new MutationObserver(records=>{__repeatModelSrcChanges+=records.length});__repeatModelObserver.observe(frame,{attributes:true,attributeFilter:['src']})});
    const selected=await page.evaluate(()=>new URL(document.getElementById('modelFrame').src).searchParams.get('profile'));
    await page.click('#modelSwitch [data-profile="'+selected+'"]');
    const repeat=await page.evaluate(async()=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const frame=document.getElementById('modelFrame'),result={sameFrame:frame===__mainObservationFrame,sameDocument:frame.contentDocument===__repeatModelDocument,sameTime:frame.contentWindow.performance.timeOrigin===__repeatModelTime,sourceChanges:__repeatModelSrcChanges};__repeatModelObserver.disconnect();return result});
    assert.deepEqual(repeat,{sameFrame:true,sameDocument:true,sameTime:true,sourceChanges:0},'Clicking the current profile performs no iframe navigation');
    await page.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
    assert.deepEqual(await page.evaluate(()=>{const rects=[...document.querySelectorAll('#modelSwitch [data-profile]')].map(button=>button.getBoundingClientRect());return {overflow:document.documentElement.scrollWidth>innerWidth,overlap:rects.some((a,i)=>rects.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)),small:rects.some(rect=>rect.height<44),outside:rects.some(rect=>rect.left<0||rect.right>innerWidth),frames:document.querySelectorAll('#p-models iframe').length}}),{overflow:false,overlap:false,small:false,outside:false,frames:1},'All 11 mobile profile buttons are usable without overlap or horizontal overflow');
    assert.equal(await mainProgress(),progressBefore,'Model browsing and responsive layout never modify saved learning progress');
    console.log('PASS: 11 parallel profile choices, one persistent frame, complete generic/dedicated brand geometry, no navigation on repeated selection, mobile layout and unchanged saved learning progress.');
    if(config.mainOnly)return;
    await page.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    if(config.genericOnly){
      for(const lesson of [1,3,7,27,50]){
        await page.goto(base+'/learn.html?vehicle=bev&lesson='+lesson);await page.waitForFunction(()=>window.__LEARN_READY&&document.querySelector('.reading-visual-mode select'));await wholeReady();
        assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.lesson-visuals iframe')].map(frame=>frame.contentWindow.studio.profile.id)),['generic-bev',lesson===50?'generic-fcev':'generic-phev']);
        assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.lesson-visual-selector select')].map(select=>({count:select.options.length,generic:select.querySelector('optgroup').children.length}))),[{count:11,generic:4},{count:11,generic:4}]);
        const before=await stable();await page.selectOption('.lesson-visual-card:first-child select','generic-fcev');await wholeReady();assert.deepEqual(await stable(),before,'Generic powertrain choice preserves learning and reading position');
      }
      await page.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.getElementById('lessonContent').scrollWidth>document.getElementById('lessonContent').clientWidth),false,'Generic whole comparison has no mobile overflow');
      await page.goto(base+'/learn.html?vehicle=bev&part=body');await page.waitForFunction(()=>window.__LEARN_READY&&document.querySelector('.lesson-model iframe')?.contentWindow.__COMPONENT_READY===true);
      assert.equal(await page.evaluate(()=>(/SU7|小米|XC60/).test(document.getElementById('courseTitle').textContent+' '+document.querySelector('.lesson-model iframe').title+' '+document.querySelector('.lesson-model iframe').contentWindow.document.title)),false,'Generic body course and component titles contain no production-vehicle name');
      console.log('PASS: five whole courses with generic defaults and 11 grouped options, in-place progress preservation, mobile layout and generic body course titles.');
      return;
    }
    for(const lesson of [1,3,7,27,50]){
      await page.goto(base+'/learn.html?vehicle=bev&lesson='+lesson+'&ui=brand-regression-'+Date.now());
      await page.waitForFunction(()=>window.__LEARN_READY&&document.querySelector('.reading-visual-mode select'));
      assert.deepEqual(await page.evaluate(()=>({mode:document.querySelector('.reading-visual-mode select').value,frames:document.querySelectorAll('iframe').length,whole:!!document.querySelector('.lesson-visuals[data-kind="whole"]'),brand:!!document.querySelector('.brand-comparisons')})),{mode:'whole',frames:2,whole:true,brand:false});
      await wholeReady();
      assert.equal(await page.evaluate(()=>document.querySelector('.lesson-visual-card:first-child select').options.length),11,'Whole-vehicle selectors clearly offer four generic and seven brand profiles');
      assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.lesson-visuals iframe')].map(frame=>frame.contentWindow.studio.profile.id)),['generic-bev',lesson===50?'generic-fcev':'generic-phev'],'Whole lessons default to complete unbranded layouts and retain the original comparison powertrain');
      if(lesson===1){const before=await stable();await page.selectOption('.lesson-visual-card:first-child select','atto3-fwd-2023');await wholeReady();assert.deepEqual(await stable(),before,'Whole-vehicle year/profile choice preserves reading position and learning progress')}
      const before=await stable();
      await page.evaluate(()=>{window.__previousObservationFrames=[...document.querySelectorAll('iframe')]});
      await page.selectOption('.reading-visual-mode select','brand');
      assert.deepEqual(await stable(),before,'Whole to brand choice preserves location and learning state');
      assert.deepEqual(await page.evaluate(()=>({frames:document.querySelectorAll('iframe').length,whole:!!document.querySelector('.lesson-visuals[data-kind="whole"]'),brand:!!document.querySelector('.brand-comparisons'),cleaned:__previousObservationFrames.every(frame=>!frame.isConnected&&frame.src==='about:blank')})),{frames:2,whole:false,brand:true,cleaned:true});
      await page.evaluate(()=>{window.__previousObservationFrames=[...document.querySelectorAll('iframe')]});
      await page.selectOption('.reading-visual-mode select','whole');
      assert.deepEqual(await stable(),before,'Brand to whole choice preserves location and learning state');
      assert.deepEqual(await page.evaluate(()=>({frames:document.querySelectorAll('iframe').length,whole:!!document.querySelector('.lesson-visuals[data-kind="whole"]'),brand:!!document.querySelector('.brand-comparisons'),cleaned:__previousObservationFrames.every(frame=>!frame.isConnected&&frame.src==='about:blank')})),{frames:2,whole:true,brand:false,cleaned:true});
    }
    await page.goto(base+'/learn.html?vehicle=bev&lesson=1&ui=brand-regression-'+Date.now());
    await page.waitForFunction(()=>window.__LEARN_READY&&document.querySelector('.reading-visual-mode select'));
    await page.selectOption('.reading-visual-mode select','brand');
    await page.evaluate(()=>document.getElementById('lessonContent').scrollTop=210);await waitModels();
    const initial=await stable();
    await page.selectOption('.brand-model-card:first-child select','tesla-4680');await waitModels();assert.deepEqual(await stable(),initial,'Brand choice preserves the course and reading position');
    for(const group of ['motor','hybrid','fuelStack']){const before=await stable();await page.selectOption('.brand-system-selector select',group);await waitModels();assert.deepEqual(await stable(),before,'System choice preserves the course and reading position');assert.equal(await page.evaluate(()=>document.querySelectorAll('iframe').length),2);if(group==='motor'){await page.selectOption('.brand-model-card:last-child select','huawei-driveone');await waitModels()}}
    assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.brand-profile')].map(profile=>profile.querySelectorAll('dl>div').length)),[5,5,5,5,5]);
    await page.goto(base+'/learn.html?vehicle=bev&part=thermal&ui=brand-regression-'+Date.now());await page.waitForFunction(()=>window.__LEARN_READY);await page.evaluate(()=>document.getElementById('lessonContent').scrollTop=210);await waitModels();
    assert.equal(await page.evaluate(()=>document.querySelectorAll('.reading-visual-mode').length),0,'Component chapters have no extra comparison-mode layer');
    assert.equal(seen.size,12,'Every supported brand model is actually ready with its selected variant identity');
    await page.goto(base+'/learn.html?vehicle=bev&part=obc&ui=brand-regression-'+Date.now());await page.waitForFunction(()=>window.__LEARN_READY);await page.evaluate(()=>document.getElementById('lessonContent').scrollTop=210);await waitModels();
    assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.brand-model-card iframe')].map(frame=>new URL(frame.src).searchParams.get('part'))),['obc','obc']);
    await page.selectOption('.brand-model-card:first-child select','generic');await waitModels();assert.equal((await inspect())[0].expected,null,'Generic component remains selectable');
    await page.goto(base+'/learn.html?vehicle=phev&part=ptc&ui=brand-regression-'+Date.now());await page.waitForFunction(()=>window.__LEARN_READY);await page.evaluate(()=>document.getElementById('lessonContent').scrollTop=210);await waitModels();await page.selectOption('.brand-model-card:first-child select','generic');await waitModels();
    assert.equal(await page.evaluate(()=>new URL(document.querySelector('.brand-model-card iframe').src).searchParams.get('part')),'ptc','System comparison retains the original chapter component as a generic option');
    await page.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.getElementById('lessonContent').scrollWidth>document.getElementById('lessonContent').clientWidth),false);
    assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.brand-model-card')].some(card=>{const a=card.querySelector('select').getBoundingClientRect(),b=card.querySelector('button').getBoundingClientRect();return a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom})),false,'Mobile selector and interaction button do not overlap');
    const lifecycle=await page.evaluate(async()=>{const api=await import('/ui/brand-comparisons.js?v=brands-1'),host=document.querySelector('.brand-comparisons').parentElement;const first=api.mountBrandComparisons(host,{partId:'battery',builder:'battery'}),a=host.querySelectorAll('iframe').length;const second=api.mountBrandComparisons(host,{partId:'motor',builder:'motor'}),b=host.querySelectorAll('iframe').length;first();const c=host.querySelectorAll('iframe').length;second();return [a,b,c,host.querySelectorAll('iframe').length]});
    assert.deepEqual(lifecycle,[2,2,2,0],'Remount removes old frames and cleanup only removes the active mount');
    console.log('PASS: four complete generic layouts and seven real brand-profile identities, 11-choice single-frame main workbench, five whole courses with generic defaults plus brand modes, all 12 ready component variants, two-frame limit, unchanged learning stage/answers/completion, mobile layout and cleanup.');
  }finally{
    await page.goto(base+'/#course');
    const restored=await page.evaluate(f=>{for(const key of Object.keys(localStorage))if(key.startsWith('et_courseflow:')&&key.endsWith(':'+f.user))localStorage.removeItem(key);if(f.session===null)localStorage.removeItem('et_session');else localStorage.setItem('et_session',f.session);return localStorage.getItem('et_session')===f.session&&!Object.keys(localStorage).some(key=>key.startsWith('et_courseflow:')&&key.endsWith(':'+f.user))},fixture);
    assert(restored,'Original session restored and all temporary course records removed');await page.reload();console.log('PASS: original session restored; temporary QA course records removed; visible account refreshed.');
  }
};
const browserConfig={space:Number(process.env.UI_QA_SPACE),page:process.env.UI_QA_PAGE||'p2',base:process.env.UI_QA_URL||'http://localhost:8088',genericOnly:process.env.UI_QA_GENERIC_ONLY==='1',mainOnly:process.env.UI_QA_MAIN_ONLY==='1'};
const result=spawnSync('ego-browser',['nodejs'],{input:'('+browserCheck.toString()+')('+JSON.stringify(browserConfig)+')',encoding:'utf8',env:process.env,timeout:180000,maxBuffer:1024*1024});
if(result.stdout)process.stdout.write(result.stdout);if(result.stderr)process.stderr.write(result.stderr);if(result.error)throw result.error;process.exit(result.status??1);
