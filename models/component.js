import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BUILDERS } from './detail.js';
import { studioEnvironment, disposeAssembly } from './model-quality.js';
import { loadGenericShell } from './generic-shell.js';
import { batchStaticAssembly } from './static-assembly.js';
import { COMPONENT_VARIANTS, createComponentVariant } from './component-variants.js';

const query=new URLSearchParams(location.search),id=query.get('part')||'motor',variantId=query.get('variant');
const builderId=id==='chargeport'?'port':id;
const names={phevEngine:'混动发动机',dht:'混动变速箱',fuelTank:'燃油箱',exhaust:'排气系统',rex:'增程器',fuelStack:'燃料电池堆',h2line:'供氢管路',airComp:'空气压缩机',h2tanks:'储氢罐组',ptc:'PTC 加热器',battery:'动力电池包',bms:'电池管理系统',motor:'驱动电机',inverter:'电机控制器',reducer:'单速减速器',obc:'车载充电机',dcdc:'DC-DC 转换器',pdu:'高压配电盒',vcu:'整车控制器',compressor:'电动压缩机',thermal:'热管理系统',chargeport:'充电接口',cabin:'座舱内饰',wheel:'车轮与制动',body:'通用车身'};
const spec=variantId?COMPONENT_VARIANTS[variantId]:null;
const name=spec?.name||(id==='body'?names.body:(query.get('title')||names[id]||'部件结构')).slice(0,60);
document.getElementById('componentName').textContent=name;
document.getElementById('componentScope').textContent=variantId?'品牌架构参考 · 教学结构示意，非原厂CAD':'通用教学结构示意';
document.title=name+' · 教学结构示意';
const loader=document.getElementById('modelLoading');
let renderer,scene,controls,model,resizeObserver,intersectionObserver;
let ready=false,onScreen=true,loopRunning=false;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

try{
  if(variantId&&!spec)throw new Error('此结构变体暂未提供。');
  if(spec&&!spec.parts.includes(id))throw new Error('此结构变体不适用于当前部件。');
  if(!variantId&&id!=='body'&&!BUILDERS[builderId])throw new Error('此部件模型暂未提供。');
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.86;renderer.shadowMap.enabled=true;
  renderer.domElement.setAttribute('aria-label',name+'，可旋转缩放的结构模型');
  document.getElementById('stage').prepend(renderer.domElement);
  scene=new THREE.Scene();scene.background=new THREE.Color('#111512');scene.environment=studioEnvironment(renderer);
  scene.add(new THREE.HemisphereLight(0xe6eedb,0x151c17,.42));
  const key=new THREE.DirectionalLight(0xf0f2ed,1.8);key.position.set(-3,5,4);scene.add(key);
  const fill=new THREE.DirectionalLight(0xbdd4e2,.65);fill.position.set(3,2,-3);scene.add(fill);
  const camera=new THREE.PerspectiveCamera(39,1,.01,100);
  controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.autoRotate=!reducedMotion;controls.autoRotateSpeed=.5;
  const raw=variantId?createComponentVariant(id,variantId):id==='body'?await loadGenericShell('sedan'):BUILDERS[builderId]();
  if(id==='body')raw.userData.setShellMode('xray',.24);
  raw.updateMatrixWorld(true);
  const fullBounds=new THREE.Box3().setFromObject(raw),fullSize=fullBounds.getSize(new THREE.Vector3());
  const focus=raw.userData.focusRole&&raw.getObjectByName(raw.userData.focusRole);
  const fitBounds=focus?new THREE.Box3().setFromObject(focus).expandByScalar(fullSize.length()*.075):fullBounds;
  if(focus)document.getElementById('componentScope').textContent='集成总成功能区：'+names[id]+' · 非原厂CAD';
  model=id==='body'?raw:batchStaticAssembly(raw);scene.add(model);
  const center=fitBounds.getCenter(new THREE.Vector3()),size=fitBounds.getSize(new THREE.Vector3());
  function reset(){
    const direction=new THREE.Vector3(1,.75,1.15).normalize();
    const right=new THREE.Vector3(direction.z,0,-direction.x).normalize(),up=new THREE.Vector3().crossVectors(direction,right);
    const project=axis=>Math.abs(axis.x)*size.x+Math.abs(axis.y)*size.y+Math.abs(axis.z)*size.z;
    const tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const distance=(Math.max(project(up)/(2*tangent),project(right)/(2*tangent*camera.aspect))+project(direction)/2)*1.12;
    camera.position.copy(center).addScaledVector(direction,distance);controls.target.copy(center);
    controls.minDistance=Math.max(size.length()*.22,.05);controls.maxDistance=fullSize.length()*5;controls.update();
  }
  let viewportWidth=0,viewportHeight=0;
  function resize(){
    const rect=renderer.domElement.getBoundingClientRect();if(!rect.width||!rect.height)return;
    if(Math.abs(rect.width-viewportWidth)<.5&&Math.abs(rect.height-viewportHeight)<.5)return;
    viewportWidth=rect.width;viewportHeight=rect.height;
    renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();
    reset();
  }
  resizeObserver=new ResizeObserver(resize);resizeObserver.observe(renderer.domElement);resize();
  document.getElementById('reset').onclick=reset;
  const rotation=document.getElementById('rotation');
  const updateRotation=()=>{rotation.textContent=controls.autoRotate?'暂停旋转':'自动旋转';rotation.setAttribute('aria-pressed',String(controls.autoRotate));};
  rotation.onclick=()=>{controls.autoRotate=!controls.autoRotate;updateRotation();};updateRotation();
  let pageActive=true,disposed=false;
  const draw=()=>{controls.update();renderer.render(scene,camera);};
  const syncLoop=()=>{const running=ready&&pageActive&&onScreen&&!document.hidden;if(running===loopRunning)return;loopRunning=running;renderer.setAnimationLoop(running?draw:null);};
  intersectionObserver=new IntersectionObserver(entries=>{onScreen=entries.some(entry=>entry.isIntersecting);syncLoop();});
  intersectionObserver.observe(renderer.domElement);document.addEventListener('visibilitychange',syncLoop);
  ready=true;syncLoop();loader.hidden=true;window.__COMPONENT_READY=true;
  window.componentStudio={model,renderer,scene,camera,controls,variant:raw.userData.variant||null,get rendering(){return loopRunning;}};
  window.addEventListener('pagehide',event=>{
    pageActive=false;syncLoop();
    if(event.persisted||disposed)return;
    disposed=true;ready=false;resizeObserver.disconnect();intersectionObserver.disconnect();controls.dispose();disposeAssembly(model);scene.environment?.dispose();renderer.dispose();
  });
  window.addEventListener('pageshow',()=>{if(disposed)return;pageActive=true;resize();syncLoop();});
}catch(error){
  loader.textContent=error.message?.startsWith('此')?error.message:'模型暂时无法加载，请刷新重试。';
  loader.classList.add('error');console.error(error);renderer?.setAnimationLoop(null);
}
