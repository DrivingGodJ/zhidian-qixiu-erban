import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const glb=await readFile(new URL('models/assets/su7-debadged.glb',root));
assert.equal(glb.toString('ascii',0,4),'glTF');
assert.equal(glb.readUInt32LE(8),glb.length,'GLB byte length');
const data=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
assert.equal(data.asset.extras.license.split(' ')[0],'CC-BY-4.0');
assert(!data.nodes.some(n=>['Object_12','Object_14'].includes(n.name)),'front and rear badge nodes removed');
let triangles=0;for(const mesh of data.meshes)for(const p of mesh.primitives)triangles+=data.accessors[p.indices].count/3;
assert(triangles>150000 && triangles<165000,'expected detailed debadged mesh');
for(const key of ['bev','phev','erev','fcev']){
 const context={window:{}};vm.createContext(context);vm.runInContext(await readFile(new URL('models/cfg-'+key+'.js',root),'utf8'),context);
 assert(context.window.MODEL_CFG.parts.length>=12);
 const html=await readFile(new URL('models/'+key+'.html',root),'utf8');
 assert(html.includes('/videos/three.module.js')&&html.includes('/vendor/three/addons/'),'local Three.js only');
}
for(const path of ['controls/OrbitControls.js','loaders/GLTFLoader.js','utils/BufferGeometryUtils.js','utils/SkeletonUtils.js','environments/RoomEnvironment.js'])await access(new URL('vendor/three/addons/'+path,root));
console.log('PASS: 4 powertrains, local loader dependencies, CC BY 4.0 credits, removed badge nodes, '+triangles+' triangles.');
