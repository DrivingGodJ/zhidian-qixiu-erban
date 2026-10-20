// Shared, local-only studio for all four teaching powertrains.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { studioEnvironment } from './model-quality.js';
import { BUILDERS } from './detail.js';
import { loadSU7Shell } from './su7-shell.js';
import { loadXC60Shell } from './xc60-shell.js';
import { loadModel3Shell } from './model3-shell.js';
import { loadGenericShell } from './generic-shell.js';
import { batchStaticAssembly } from './static-assembly.js';
import { getVehicleProfile } from './vehicle-profiles.js';
import { getGenericVehicleProfile } from './generic-profiles.js';
import { VEHICLE_COMPONENT_BUILDERS } from './vehicle-component-geometry.js';

const BASE_CFG = window.MODEL_CFG;
const Q = new URLSearchParams(location.search);
const EMBED = Q.get('embed') === '1', HERO = Q.get('hero') === '1';
const BRIDGE = Q.get('bridge') === '1', EXPLORE=Q.get('explore')==='1';
document.body.classList.toggle('explore',EXPLORE);
document.body.classList.toggle('compare',Q.get('compare')==='1');
const KEY = BASE_CFG.key || location.pathname.match(/\/(\w+)\.html$/)?.[1] || 'bev';
const requestedProfile=Q.get('profile');
const generic=!requestedProfile||requestedProfile==='generic-'+KEY;
const PROFILE = generic ? null : getVehicleProfile(requestedProfile);
if ((!generic&&!PROFILE) || (PROFILE&&PROFILE.powertrain !== KEY)) {
  const loading = document.getElementById('modelLoading');
  loading.classList.add('error');loading.textContent='车型版本与动力类型不匹配，请重新选择车型。';
  throw new Error('Invalid vehicle profile for '+KEY);
}
const colors=['#82aca0','#c9ad7a','#7ca2c0','#ac9bc2','#bcaa8a','#8fa87c','#ad8798','#7cafa5'];
const VIEW_PROFILE=PROFILE||getGenericVehicleProfile(KEY);
const CFG = {...BASE_CFG,title:VIEW_PROFILE.name,tag:KEY.toUpperCase()+' · '+VIEW_PROFILE.year,
  parts:(PROFILE?PROFILE.parts:BASE_CFG.parts).map((p,i)=>({...p,color:p.color||colors[i%colors.length]}))};
const shellName=VIEW_PROFILE.shellScope;
document.body.dataset.vehicleProfile=VIEW_PROFILE.id;
document.body.classList.toggle('embed', EMBED);
document.body.classList.toggle('hero', HERO);
document.body.classList.toggle('bridge', BRIDGE);
const wrap = document.getElementById('stage');
const loader = document.getElementById('modelLoading');
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: HERO }); }
catch (e) { loader.classList.add('error'); loader.textContent = '浏览器暂时无法启动 3D，请开启硬件加速后重试。'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .82;
wrap.prepend(renderer.domElement);
renderer.domElement.setAttribute('aria-label', '可旋转、缩放的 '+shellName+'教学模型');
const scene = new THREE.Scene();
scene.background = HERO ? null : new THREE.Color('#111512');
scene.fog = new THREE.Fog('#111512', 16, 40);
const camera = new THREE.PerspectiveCamera(HERO ? 34 : 40, 1, .05, 70);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, .65, 0);
controls.enableDamping = true;
controls.dampingFactor = .07;
controls.autoRotate = !HERO && Q.get('rotate') === '1' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.autoRotateSpeed = .35;
controls.minDistance = 1.4;
controls.maxDistance = 14;
controls.maxPolarAngle = Math.PI / 2 - .02;
controls.enablePan = !HERO;
controls.enableZoom = !HERO;
if (HERO) controls.enableRotate = false;

scene.environment = studioEnvironment(renderer);
scene.environmentIntensity = .65;
scene.add(new THREE.HemisphereLight(0xe3e9e1, 0x151c17, .22));
const keyLight = new THREE.DirectionalLight(0xf0f2ed, 1.4);
keyLight.position.set(-4, 7, 5); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
Object.assign(keyLight.shadow.camera, { left:-5, right:5, top:5, bottom:-5, near:.1, far:20 });
keyLight.shadow.bias = -.0002;
keyLight.shadow.normalBias = .025;
scene.add(keyLight);
const rim = new THREE.DirectionalLight(0xb9cbd2, .65);rim.position.set(4, 3, -4);scene.add(rim);
const fill = new THREE.DirectionalLight(0xd2dbc9, .25);fill.position.set(-6, 2, -3);scene.add(fill);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(100,100), new THREE.MeshBasicMaterial({ color:0x151b16, toneMapped:false }));
floor.rotation.x = -Math.PI/2;floor.receiveShadow = true;
if (!HERO) {
  scene.add(floor);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.28}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.001;shadow.receiveShadow=true;scene.add(shadow);
}
else { const shadow = new THREE.Mesh(new THREE.PlaneGeometry(16,16), new THREE.ShadowMaterial({opacity:.32}));shadow.rotation.x=-Math.PI/2;shadow.receiveShadow=true;scene.add(shadow); }
const grid = new THREE.GridHelper(30,60,0x354032,0x20291f);grid.position.y=.003;grid.material.transparent=true;grid.material.opacity=.28;if(!HERO)scene.add(grid);
const car = new THREE.Group();scene.add(car);
const parts = [], pickables = [];
const partsRoot = new THREE.Group();partsRoot.position.y=-.095;car.add(partsRoot);
for (const [idx, p] of (HERO ? [] : CFG.parts).entries()) {
  if(p.shellPart)continue;
  const builder = PROFILE ? VEHICLE_COMPONENT_BUILDERS[p.geometry] : BUILDERS[p.b];
  if (!builder || (PROFILE && !p.geometry)) {
    loader.classList.add('error');loader.textContent='对应部件模型尚未准备好，请重新选择或稍后重试。';
    throw new Error('Missing specific geometry for '+VIEW_PROFILE.id+'/'+p.id);
  }
  const group = batchStaticAssembly(builder(p.opt || {}));
  group.position.fromArray(p.p);
  // The exhaust builder already contains the underfloor Y/Z offset.
  if(p.b==='exhaust'){group.position.y-=.2;group.position.z-=.52;}
  if(p.rot)group.rotation.fromArray(p.rot);
  if(p.scale)group.scale.fromArray(p.scale);
  const materials = new Set();
  group.traverse(o => { if(o.isMesh){ o.userData.partIdx=idx;if(!p.visualOnly)pickables.push(o);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if(!m.userData.baseEmissive)m.userData.baseEmissive={color:m.emissive?.getHex()||0,intensity:m.emissiveIntensity||0};} } });
  group.updateMatrixWorld(true);
  const anchorLocal=group.worldToLocal(new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3()));
  const localCenter=anchorLocal.clone().multiply(group.scale).applyEuler(group.rotation);
  const original = group.position.clone();
  partsRoot.add(group);parts.push({idx,group,cfg:p,materials,original,localCenter,anchorLocal});
}
partsRoot.visible = !HERO;

// Do not invent vehicle-specific HV / coolant routing from generic connection lanes.
let shell, shellMode = HERO?'solid':'xray';
let under = Q.get('view') === 'under', exploded = false, selected = -1;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let shellAlpha=shellMode==='solid'?1:shellMode==='hidden'?0:.08;
let shellTarget=shellAlpha,cameraMotion=null;
let labelsOn=Q.get('labels')==='1';
const labelLayer=document.createElement('div');labelLayer.className='part-labels';wrap.append(labelLayer);
const labelList=document.createElement('div');labelList.className='label-list';labelLayer.append(labelList);
const leaders=document.createElementNS('http://www.w3.org/2000/svg','svg');leaders.classList.add('label-leaders');labelLayer.append(leaders);
for(const pt of parts){
  if(pt.cfg.visualOnly)continue;
  const b=document.createElement('button');b.className='part-label';b.style.setProperty('--part-color',pt.cfg.color);
  const no=document.createElement('span');no.className='label-index';no.textContent=String(pt.idx+1).padStart(2,'0');
  const name=document.createElement('span');name.textContent=pt.cfg.name.split('（')[0];b.append(no,name);b.onclick=()=>select(pt.idx);
  const pin=document.createElement('button');pin.className='part-pin';pin.textContent=String(pt.idx+1).padStart(2,'0');pin.setAttribute('aria-label',pt.cfg.name);pin.onclick=()=>select(pt.idx);
  labelList.append(b);labelLayer.append(pin);pt.label=b;pt.pin=pin;
  const line=document.createElementNS('http://www.w3.org/2000/svg','path');leaders.append(line);pt.leader=line;
}
const labelsButton=document.createElement('button');labelsButton.textContent='部件标注';labelsButton.classList.toggle('on',labelsOn);labelsButton.setAttribute('aria-pressed',String(labelsOn));labelsButton.onclick=()=>{labelsOn=!labelsOn;if(labelsOn)stopRotation();labelsButton.classList.toggle('on',labelsOn);labelsButton.setAttribute('aria-pressed',String(labelsOn));};document.querySelector('.stage-toolbar').prepend(labelsButton);
const card = document.getElementById('partCard');
const rail = document.querySelector('.chiprow');
CFG.parts.forEach((p,idx)=>{
  if(p.visualOnly)return;
  const b=document.createElement('button');b.className='pchip';b.dataset.idx=idx;
  b.innerHTML='<i class="d"></i><span class="chip-name"></span>';
  b.querySelector('i').style.background=p.color;b.querySelector('span').textContent=p.name.split('（')[0];
  b.onclick=()=>select(idx);rail?.append(b);
});
function select(idx) {
  selected=idx;
  for(const pt of parts)for(const m of pt.materials)if(m.emissive){const active=pt.idx===idx;m.emissive.setHex(active?0x476c1e:m.userData.baseEmissive.color);m.emissiveIntensity=active?.45:m.userData.baseEmissive.intensity;}
  document.querySelectorAll('.pchip').forEach(b=>{const active=+b.dataset.idx===idx;b.classList.toggle('on',active);b.setAttribute('aria-pressed',String(active));});
  const p=CFG.parts[idx];
  if(!p){card.classList.remove('show');frame(true);return;}
  focusPart(idx);
  if(BRIDGE){parent.postMessage({type:'studio:select',partId:p.id},location.origin);return;}
  document.getElementById('pcName').textContent=p.name;
  const specific=parts.find(pt=>pt.idx===idx)?.group.userData.vehicleComponent;
  document.getElementById('pcDesc').textContent=p.desc+(specific?' 对应结构重建：'+specific.features+'。':'');
  const detail=document.getElementById('pcDiff');
  detail.replaceChildren(document.createTextNode(PROFILE?(p.confidence==='confirmed'?'资料已确认该总成的区域与功能；尺寸、外壳及具体坐标为教学示意。':'功能与位置为教学示意，未核实该年款的原厂拆件坐标。'):(p.diff||'通用配件教学结构，位置与尺寸不对应具体量产车型。')));
  for(const id of p.evidence||[]){
    const source=VIEW_PROFILE.sources.find(s=>s.id===id);if(!source)continue;
    const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener';a.textContent=source.title;
    detail.append(document.createElement('br'),a);
  }
  document.getElementById('pcCourse').hidden=true;
  card.classList.add('show');
  if(shellMode==='solid'&&!p.shellPart){shellMode='xray';applyMode();}
}
document.getElementById('pcClose').onclick=()=>select(-1);
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down;
renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointerup',e=>{
  if(HERO||!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>7)return;
  const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(pickables,false);select(hits.length?hits[0].object.userData.partIdx:-1);
});
renderer.domElement.addEventListener('pointermove',e=>{
  if(HERO)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);renderer.domElement.style.cursor=ray.intersectObjects(pickables,false).length?'pointer':'grab';
});
function stopRotation(){
  controls.autoRotate=false;const button=document.getElementById('tRot');button.classList.remove('on');button.textContent='旋转：关';
}
function flyTo(position,target,duration=.9){
  stopRotation();
  if(reducedMotion){camera.position.copy(position);controls.target.copy(target);cameraMotion=null;controls.update();return;}
  cameraMotion={from:camera.position.clone(),to:position.clone(),fromTarget:controls.target.clone(),target:target.clone(),start:performance.now(),duration:duration*1000};
}
function focusPart(idx){
  const pt=parts.find(p=>p.idx===idx);
  if(!pt){frame(true);return;}
  const bb=new THREE.Box3().setFromObject(pt.group),target=bb.getCenter(new THREE.Vector3()),size=bb.getSize(new THREE.Vector3());
  const front=target.x<-.5,rear=target.x>.7;
  const side=target.z<-.15?-1:1;
  const direction=new THREE.Vector3(front?-1:rear?1:.35,.65,side).normalize();
  const fit=Math.max(2.15,Math.max(size.x,size.y,size.z)*2.25);
  const position=target.clone().addScaledVector(direction,Math.min(5.7,fit));
  position.y=Math.max(.65,position.y);flyTo(position,target);
}
function frame(animate=false) {
  const a=wrap.clientWidth/Math.max(wrap.clientHeight,1);
  const comparison=Q.get('compare')==='1';
  const f=Math.max(1,Math.min(2,(HERO?1.65:comparison?1:1.25)/a));
  // Higher and closer in comparison cards, so tank axes and tunnel packs read clearly.
  const position=new THREE.Vector3(HERO?-3.8:under?4.7:comparison?-4.8:-5,HERO?1.65:under?.65:comparison?4.3:2.9,HERO?4.2:under?4.6:comparison?4.8:5).multiplyScalar(f);
  const target=new THREE.Vector3(0,under?.25:.53,0);
  if(animate)flyTo(position,target);else{camera.position.copy(position);controls.target.copy(target);controls.update();}
}
function applyMode(){
  shellTarget=under?0:shellMode==='solid'?1:.08;
  if(reducedMotion)shellAlpha=shellTarget;
  partsRoot.visible=!HERO&&(under||shellMode!=='solid'||shellAlpha<.995);
  renderer.shadowMap.needsUpdate=true;
  document.getElementById('vWhole').classList.toggle('on',!under);
  document.getElementById('vUnder').classList.toggle('on',under);
  const x=document.getElementById('tShell');x.classList.toggle('on',shellMode==='xray');x.setAttribute('aria-pressed',String(shellMode==='xray'));x.textContent=shellMode==='xray'?'透视车身':'实体车身';
}
function clearExploded(){exploded=false;const b=document.getElementById('tExplode');b.classList.remove('on');b.setAttribute('aria-pressed','false');}
function setView(mode){under=mode==='under';if(under)clearExploded();applyMode();frame(true);}
document.getElementById('vWhole').onclick=()=>setView('whole');
document.getElementById('vUnder').onclick=()=>setView('under');
document.getElementById('tShell').hidden=true;
document.getElementById('tShell').onclick=()=>{shellMode=shellMode==='solid'?'xray':'solid';if(shellMode==='solid')clearExploded();setView('whole');};
document.getElementById('tRot').onclick=function(){controls.autoRotate=!controls.autoRotate;this.classList.toggle('on',controls.autoRotate);this.textContent=controls.autoRotate?'旋转：开':'旋转：关';};
document.getElementById('tRot').classList.toggle('on',controls.autoRotate);
document.getElementById('tRot').textContent=controls.autoRotate?'旋转：开':'旋转：关';
document.getElementById('tExplode').onclick=function(){exploded=!exploded;this.classList.toggle('on',exploded);if(exploded){shellMode='xray';setView('whole');}this.setAttribute('aria-pressed',String(exploded));};
document.getElementById('tReset').onclick=()=>{clearExploded();under=false;shellMode='xray';applyMode();select(-1);};
document.getElementById('typeTitle').textContent=CFG.title;
document.querySelector('.hint').textContent='选择部件查看说明 · 拖动旋转 · 滚轮或双指缩放';
document.getElementById('typeTag').textContent=CFG.tag;
document.getElementById('stageTitle').textContent=VIEW_PROFILE.name;
document.querySelector('.stage-caption p').textContent=VIEW_PROFILE.year+' · '+shellName;
const disclaimer=document.querySelector('.stage-disclaimer');
if(disclaimer){
  disclaimer.replaceChildren(document.createTextNode(PROFILE?'按年款资料表达主总成区域；共用比例框架，非原厂 CAD 或毫米级装配。':'集中展示全部通用配件，非量产车型配置或原厂装配。'));
  const a=document.createElement('a');a.href='assets/ATTRIBUTION.md';a.target='_blank';a.rel='noopener';a.textContent='外观模型来源与署名';disclaimer.append(document.createElement('br'),a);
}
controls.addEventListener('start',()=>{cameraMotion=null;stopRotation();});
window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==parent)return;
  if(e.data?.type==='studio:view')setView(e.data.view==='under'?'under':'whole');
  if(e.data?.type==='studio:drive'){
    const id=e.data.driving?'motor':'obc';
    const pt=parts.find(p=>p.cfg.id===id);
    for(const item of parts)for(const m of item.materials)if(m.emissive){m.emissive.setHex(item===pt?0x476c1e:m.userData.baseEmissive.color);m.emissiveIntensity=item===pt?.45:m.userData.baseEmissive.intensity;}
    document.querySelector('.stage-status').textContent=e.data.driving?'DRIVE / 电能 → 动能':'CHARGE / 交流 → 直流';
  }
});
let heroDirty=true;
const resize=new ResizeObserver(()=>{const w=wrap.clientWidth,h=wrap.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(selected<0)frame();heroDirty=true;});resize.observe(wrap);
let active=!document.hidden;
document.addEventListener('visibilitychange',()=>{active=!document.hidden;});
let visible=true;new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;}).observe(wrap);
const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{
  const delta=Math.min(clock.getDelta(),.05);if(!active||!visible||(HERO&&!heroDirty))return;
  for(const pt of parts){const offset=exploded?new THREE.Vector3(pt.original.x*.22,.45+Math.abs(pt.original.x)*.15,pt.original.z*.45):new THREE.Vector3();const target=pt.original.clone().add(offset);if(pt.group.position.distanceToSquared(target)>.000001)renderer.shadowMap.needsUpdate=true;pt.group.position.lerp(target,reducedMotion?1:1-Math.exp(-delta*7));}
  // Wheels stay grounded while the independent teaching assemblies separate.
  if(shell){
    const previous=shellAlpha;shellAlpha=reducedMotion?shellTarget:THREE.MathUtils.damp(shellAlpha,shellTarget,6,delta);
    if(Math.abs(shellAlpha-shellTarget)<.001)shellAlpha=shellTarget;
    if(shellAlpha!==previous||shell.userData.opacity!==shellAlpha){
      shell.userData.setShellProgress(shellAlpha===1?'solid':shellAlpha===0?'hidden':'xray',shellAlpha);
      renderer.shadowMap.needsUpdate=true;
    }
    partsRoot.visible=!HERO&&(under||shellMode!=='solid'||shellAlpha<.995);
  }
  if(cameraMotion){
    const t=Math.min(1,(performance.now()-cameraMotion.start)/cameraMotion.duration),e=1-Math.pow(1-t,3);
    camera.position.lerpVectors(cameraMotion.from,cameraMotion.to,e);controls.target.lerpVectors(cameraMotion.fromTarget,cameraMotion.target,e);
    if(t===1)cameraMotion=null;
  }
  labelLayer.hidden=!labelsOn||!partsRoot.visible||HERO;
  labelLayer.classList.toggle('compact',wrap.clientWidth<850);
  if(!labelLayer.hidden){
    const candidates=[];
    for(const pt of parts){
      if(!pt.label)continue;
      const point=pt.group.localToWorld(pt.anchorLocal.clone()).project(camera);
      const hidden=point.z>1||Math.abs(point.x)>1||Math.abs(point.y)>1;
      pt.label.hidden=hidden||(selected>=0&&selected!==pt.idx);pt.pin.hidden=pt.label.hidden;pt.leader.style.display=pt.label.hidden?'none':'';
      pt.label.classList.toggle('active',pt.idx===selected);pt.pin.classList.toggle('active',pt.idx===selected);
      if(hidden)continue;
      const x=(point.x*.5+.5)*wrap.clientWidth,y=(-point.y*.5+.5)*wrap.clientHeight;
      pt.pin.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;
      if(!pt.label.hidden)candidates.push({pt,x,y});
    }
    if(wrap.clientWidth<850){
      candidates.sort((a,b)=>a.pt.idx-b.pt.idx).forEach((item,i)=>{
        item.pt.label.style.transform='none';item.pt.label.style.left=(i%2?50:0)+'%';item.pt.label.style.top=(75+Math.floor(i/2)*43)+'px';
        item.pt.leader.style.display='none';
      });
    }else{
      candidates.sort((a,b)=>a.x-b.x);const middle=Math.ceil(candidates.length/2),sides=[candidates.slice(0,middle),candidates.slice(middle)];
      for(const [side,items] of sides.entries()){
        items.sort((a,b)=>a.y-b.y);
        const gap=Math.min(46,(wrap.clientHeight-240)/Math.max(items.length-1,1));
        const top=Math.max(125,(wrap.clientHeight-gap*(items.length-1))/2);
        for(const [i,item] of items.entries()){
          const x=side?wrap.clientWidth-115:115,y=top+i*gap;
          item.pt.label.style.left='0';item.pt.label.style.top='0';item.pt.label.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;
          const edge=x+(side?-105:105),elbow=edge+(side?-24:24);
          item.pt.leader.setAttribute('d',`M${item.x},${item.y} L${elbow},${item.y} L${elbow},${y} L${edge},${y}`);
        }
      }
    }
  }
  controls.update(delta);renderer.render(scene,camera);heroDirty=false;
});
try { shell=await (VIEW_PROFILE.shell==='model3'?loadModel3Shell():VIEW_PROFILE.shell==='xc60'?loadXC60Shell():VIEW_PROFILE.shell==='generic-suv'?loadGenericShell('suv',{includeCabin:generic}):VIEW_PROFILE.shell==='generic-sedan'?loadGenericShell('sedan',{includeCabin:generic}):loadSU7Shell());car.add(shell);applyMode();shellAlpha=shellTarget;shell.userData.setShellProgress(shellAlpha===1?'solid':shellAlpha===0?'hidden':'xray',shellAlpha);heroDirty=true;loader.hidden=true;window.__STUDIO_READY=true;document.body.dataset.modelReady='true'; }
catch(e){loader.classList.add('error');loader.replaceChildren(document.createTextNode('模型加载失败，请检查资源后重试。'));const retry=document.createElement('button');retry.textContent='重新加载';retry.onclick=()=>location.reload();loader.append(retry);console.error('Teaching model failed',e);}
frame();
window.studio={scene,camera,renderer,controls,parts,profile:VIEW_PROFILE,generic,get shell(){return shell;},select,setView,get mode(){return shellMode;},get shellAlpha(){return shellAlpha;},get cameraAnimating(){return !!cameraMotion;}};
window.vehicleStudio=window.studio;
