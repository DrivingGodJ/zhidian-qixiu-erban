import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),threeURL=new URL('videos/three.module.js',root).href;
const THREE=await import(threeURL),dataURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const source=path=>readFile(new URL(path,root),'utf8');
const qualityURL=dataURL((await source('models/model-quality.js')).replace("from 'three'",`from '${threeURL}'`));
const detailURL=dataURL((await source('models/detail.js')).replace("from 'three'",`from '${threeURL}'`).replace("from './model-quality.js'",`from '${qualityURL}'`));
const variantURL=dataURL((await source('models/component-variants.js')).replace("from 'three'",`from '${threeURL}'`).replace("from './model-quality.js'",`from '${qualityURL}'`).replace("from './detail.js'",`from '${detailURL}'`));
const utilsURL=dataURL((await source('vendor/three/addons/utils/BufferGeometryUtils.js')).replace("from 'three'",`from '${threeURL}'`));
const batchURL=dataURL((await source('models/static-assembly.js')).replace("from 'three'",`from '${threeURL}'`).replace("from 'three/addons/utils/BufferGeometryUtils.js'",`from '${utilsURL}'`));
const {COMPONENT_VARIANTS,createComponentVariant}=await import(variantURL),{batchStaticAssembly}=await import(batchURL),{disposeAssembly}=await import(qualityURL);
const signatures=new Set(),stats=[];
function inspect(model){
  model.updateMatrixWorld(true);let triangles=0,meshes=0;const hash=createHash('sha256');
  model.traverse(object=>{if(!object.isMesh)return;meshes++;triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3;
    for(const [name,attribute]of Object.entries(object.geometry.attributes))for(const number of attribute.array)assert(Number.isFinite(number),`${model.name}: finite ${name}`);
    const p=object.geometry.attributes.position,world=new THREE.Vector3();
    for(let i=0;i<p.count;i++){world.fromBufferAttribute(p,i).applyMatrix4(object.matrixWorld);hash.update(world.toArray().map(v=>Math.round(v*10000)).join(','));}
  });
  const size=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());assert(size.toArray().every(v=>v>0&&Number.isFinite(v)));
  return{meshes,triangles,size:size.toArray(),signature:hash.digest('hex')};
}
const named=(model,prefix)=>{const items=[];model.traverse(o=>{if(o.name.startsWith(prefix))items.push(o);});return items;};
for(const[id,spec]of Object.entries(COMPONENT_VARIANTS)){
  const model=createComponentVariant(spec.part,id),before=inspect(model);
  assert(model.userData.variant.scope.includes('非原厂CAD'));assert(spec.source.startsWith('https://'));
  assert(!signatures.has(before.signature),`${id}: real geometric distinction`);signatures.add(before.signature);
  if(id==='byd-blade'){assert.equal(named(model,'blade_cell_').length,26);const p=named(model,'blade_cell_')[0].geometry.parameters;assert(p.depth/p.width>15);}
  if(id==='catl-ctp'){assert.equal(named(model,'prismatic_cell_').length,36);assert.equal(named(model,'intercell_cooling_layer_').length,8);}
  if(id==='tesla-4680'){assert.equal(named(model,'cylindrical_cell_').length,120);assert.equal(named(model,'cylindrical_cell_')[0].geometry.type,'CylinderGeometry');}
  if(id==='tesla-induction')assert.equal(named(model,'squirrel_cage_bar_').length,24);
  if(id==='byd-pmsm')assert.equal(model.children.filter(o=>o.name.startsWith('role_')).length,8);
  if(id==='huawei-driveone')assert.equal(model.children.filter(o=>o.name.startsWith('role_')).length,7);
  if(id==='toyota-ths'){assert(model.getObjectByName('planetary_ring'));assert.equal(named(model,'planet_gear_').length,3);}
  if(id==='byd-dmi-ehs'){assert(model.getObjectByName('direct_coupling_clutch'));assert(!model.getObjectByName('planetary_ring'));}
  if(id==='tesla-octovalve')assert.equal(named(model,'coolant_port_').length,8);
  if(id==='denso-heatpump'){assert(model.getObjectByName('gas_liquid_separator'));assert.equal(named(model,'condenser_fin').length,30);}
  if(id==='toyota-mirai')assert.equal(named(model,'sample_bipolar_plate_').length,22);
  if(id==='hyundai-nexo')assert.equal(named(model,'sample_bipolar_plate_').length,30);
  for(const part of spec.parts.filter(p=>p!==spec.part)){const focused=createComponentVariant(part,id);assert(focused.getObjectByName(focused.userData.focusRole),`${id}/${part}: real focus group`);disposeAssembly(focused);}
  const batched=batchStaticAssembly(model),after=inspect(batched);
  assert.equal(after.triangles,before.triangles,`${id}: batching preserves surfaces`);assert(after.meshes<=32,`${id}: bounded draw calls`);assert(after.triangles<160000,`${id}: bounded triangle count`);
  stats.push({id,part:spec.part,drawCalls:after.meshes,triangles:after.triangles,features:spec.features});disposeAssembly(batched);
}
assert.equal(stats.length,12);assert.throws(()=>createComponentVariant('battery','unknown'));assert.throws(()=>createComponentVariant('battery','byd-pmsm'));
console.log(JSON.stringify({variants:stats.length,allGeometricallyDistinct:signatures.size===12,checks:'finite surfaces, physical cell forms, real rotors/gears/valves, strict part matching, local focus groups, batch preservation and performance passed',models:stats},null,2));
