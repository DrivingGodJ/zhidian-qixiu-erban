import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const root = new URL('../', import.meta.url), threeURL = new URL('videos/three.module.js',root).href;
const THREE = await import(threeURL);
const toURL = s => 'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const helperURL=toURL((await readFile(new URL('models/model-quality.js',root),'utf8')).replace("from 'three'",`from '${threeURL}'`));
const Q = await import(helperURL);
const detailURL=toURL((await readFile(new URL('models/detail.js',root),'utf8')).replace("from 'three'",`from '${threeURL}'`).replace("from './model-quality.js'",`from '${helperURL}'`));
const {BUILDERS}=await import(detailURL);
function checkGroup(g, label){
 let meshes=0, vertices=0;
 g.traverse(o=>{if(o.isMesh){meshes++;vertices+=o.geometry.attributes.position.count;for(const attribute of [o.geometry.attributes.position,o.geometry.attributes.normal])if(attribute)for(const value of attribute.array)assert(Number.isFinite(value),`${label}: finite geometry`);}});
 assert(meshes>0,`${label}: mesh created`);
 const bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(new THREE.Vector3());
 assert(size.x>0&&size.y>0&&size.z>0,`${label}: 3D bounds`);
 return {meshes,vertices};
}
for(const [name,builder] of Object.entries(BUILDERS)) console.log('builder',name,checkGroup(builder(),name));
assert.equal(Object.keys(BUILDERS).length,24);
const box=Q.qualityGeometry(new THREE.BoxGeometry(.2,.1,.3));
const cylinder=Q.qualityGeometry(new THREE.CylinderGeometry(.2,.2,.3,24));
assert.equal(box.type,'BoxGeometry');assert.equal(cylinder.type,'CylinderGeometry');assert.equal(cylinder.parameters.radiusTop,.2);
const finish=Q.finishPalette(),nextFinish=Q.finishPalette();
assert(finish.aluminum.normalMap&&finish.aluminum.roughnessMap,'metal has fine surface texture');
assert.equal(finish.rubber.normalMap,null,'rubber does not inherit metallic machining grain');
assert.equal(finish.aluminum.normalMap,nextFinish.steel.normalMap,'surface texture is shared across previews');
let textureDisposed=false,materialDisposed=false;
finish.aluminum.normalMap.addEventListener('dispose',()=>textureDisposed=true);
finish.aluminum.addEventListener('dispose',()=>materialDisposed=true);
Q.disposeAssembly(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),finish.aluminum));
assert(materialDisposed&&!textureDisposed,'disposing a preview releases its material but preserves shared finish maps');
const html=await readFile(new URL('videos/repair-game.html',root),'utf8');
const materials=html.slice(html.indexOf('const M={'),html.indexOf('/* ================= 道具 3D 建模'));
const modeling=html.slice(html.indexOf('function P(parent'),html.indexOf('/* ================= 18 个关卡定义'));
const levels=html.slice(html.indexOf('const LEVELS=['),html.indexOf('/* ================= 游戏引擎'));
const tools=html.slice(html.indexOf('function buildTool'),html.indexOf('/* 道具图标：离屏渲染为 PNG */'));
const document={createElement(){return {getContext(){return {fillRect(){},strokeRect(){},fillText(){}}}}}};
const make=Function('THREE','qualityGeometry','refineAssembly','fastener','cable','connector','finishPalette','document',`const scene=new THREE.Scene();const glowL=new THREE.PointLight(),arcL=new THREE.PointLight(),heatL=new THREE.PointLight();const toolFinishes=finishPalette();const addOrderDone=()=>{},showMeter=()=>{},heatLight=()=>{};${materials}${modeling}${tools}${levels};return {LEVELS,buildTool};`);
const {LEVELS,buildTool}=make(THREE,Q.qualityGeometry,Q.refineAssembly,Q.fastener,Q.cable,Q.connector,Q.finishPalette,document);
let maxMeshes=0,steps=0;
for(const level of LEVELS){
 const ctx=level.build();Q.refineAssembly(ctx.g);
 const stats=checkGroup(ctx.g,level.id);maxMeshes=Math.max(maxMeshes,stats.meshes);
 for(const step of level.steps){if(step.done)step.done(ctx);steps++;}
 console.log('level',level.id,stats,'steps',level.steps.length);
}
for(const id of ['poweroff','gloves','wrench','torque','meter','diag','heatgun','paint','megger','fill','vac','clamp','cleaner'])console.log('tool',id,checkGroup(buildTool(id),id));
console.log(JSON.stringify({builders:Object.keys(BUILDERS).length,levels:LEVELS.length,steps,tools:13,maxMeshes,selectorTypes:'preserved'}));
