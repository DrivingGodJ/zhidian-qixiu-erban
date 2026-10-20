import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),threeURL=new URL('videos/three.module.js',root).href;
const THREE=await import(threeURL),toURL=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const helper=toURL((await readFile(new URL('models/model-quality.js',root),'utf8')).replace("from 'three'",`from '${threeURL}'`));
const detail=toURL((await readFile(new URL('models/detail.js',root),'utf8')).replace("from 'three'",`from '${threeURL}'`).replace("from './model-quality.js'",`from '${helper}'`));
const {BUILDERS}=await import(detail),round=v=>Math.round(v*1000)/1000,vec=v=>v.toArray().map(round),out={reference:{scope:'Generic powertrain teaching arrangements; not Xiaomi SU7 or any named manufacturer internal service data',forward:'-X',rear:'+X',up:'+Y',lateral:'Z',groundShiftY:-.095,shellReference:{x:[-2.4957,2.4957],y:[.005,1.401]},sources:['https://global.toyota/en/powertrain/ths/','https://newsroom.toyota.eu/the-new-toyota-mirai/'],note:'Primary sources support functional architecture and show that FCEV tank arrangements vary. The three transverse tanks shown here are a generic schematic, not the Mirai T arrangement.'},local:{},vehicles:{}};
for(const [name,fn]of Object.entries(BUILDERS)){const g=fn();const b=new THREE.Box3().setFromObject(g);out.local[name]={min:vec(b.min),max:vec(b.max),size:vec(b.getSize(new THREE.Vector3()))};}
for(const key of ['bev','phev','erev','fcev']){
 const context={window:{}};vm.runInNewContext(await readFile(new URL(`models/cfg-${key}.js`,root),'utf8'),context);
 const cfg=context.window.MODEL_CFG,parts=[];
 for(const p of cfg.parts){if(p.shellPart||!BUILDERS[p.b])continue;const g=BUILDERS[p.b](p.opt||{});g.position.fromArray(p.p);if(p.b==='exhaust'){g.position.y-=.2;g.position.z-=.52;}if(p.rot)g.rotation.fromArray(p.rot);const b=new THREE.Box3().setFromObject(g);const center=b.getCenter(new THREE.Vector3());
 const axes={};for(const [name,v]of Object.entries({shaftZ:new THREE.Vector3(0,0,1),shaftX:new THREE.Vector3(1,0,0),up:new THREE.Vector3(0,1,0)}))axes[name]=vec(v.applyEuler(g.rotation));
 assert([...b.min.toArray(),...b.max.toArray()].every(Number.isFinite),`${key}/${p.b}: finite bounds`);
 assert(b.min.y-.095>.005,`${key}/${p.b}: clears ground`);
 assert(b.min.x>=-2.4957&&b.max.x<=2.4957,`${key}/${p.b}: inside vehicle length`);
 assert(Math.max(Math.abs(b.min.z),Math.abs(b.max.z))<.95,`${key}/${p.b}: inside side envelope`);
 if(p.b==='thermal')assert(Math.abs(axes.shaftZ[0]-1)<.001,`${key}: fan normal +X`);
 if(p.b==='motor')assert(Math.abs(axes.shaftZ[2])>.999,`${key}: motor axis transverse Z`);
 if(['phevEngine','dht','rex','reducer','h2tanks'].includes(p.b))assert(Math.abs(axes.shaftX[2])>.999,`${key}/${p.b}: shaft/tank axis transverse Z`);
 if(p.b==='battery'){assert(axes.up[1]>.999,`${key}: battery flat`);assert(b.min.x> -1.45&&b.max.x<1.45,`${key}: battery between axle centers`);}
 if(p.b==='port')assert(Math.sign(axes.shaftZ[2])===Math.sign(p.p[2]),`${key}: port faces outboard`);
 parts.push({b:p.b,p:p.p,rot:p.rot||[0,0,0],min:vec(b.min),max:vec(b.max),center:vec(center),groundedCenter:vec(center.clone().add(new THREE.Vector3(0,-.095,0))),size:vec(b.getSize(new THREE.Vector3())),groundMinY:round(b.min.y-.095),axes,_box:b});}
 const intersections=[];
 for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){const overlap=parts[i]._box.clone().intersect(parts[j]._box);if(!overlap.isEmpty()){const size=overlap.getSize(new THREE.Vector3());if(Math.min(size.x,size.y,size.z)>.004)intersections.push({parts:[parts[i].b,parts[j].b],size:vec(size),volume:round(size.x*size.y*size.z)});}}
 assert.equal(intersections.length,0,`${key}: assemblies have disjoint bounds`);
 out.vehicles[key]={checks:{assemblies:parts.length,fanNormal:'positive X',motorAxis:'Z',allInsideLength:true,allClearGround:true,assemblyBoundsOverlap:false},parts:parts.map(({_box,...rest})=>rest),intersections};
}
const report=process.argv.find(arg=>arg.startsWith('--report='));if(report)await writeFile(report.slice(9),JSON.stringify(out,null,2));
if(process.argv.includes('--local'))console.log(JSON.stringify(out.local,null,2));else for(const [key,v]of Object.entries(out.vehicles)){console.log(key,JSON.stringify(v.checks),'lowestGroundedY',Math.min(...v.parts.map(p=>p.groundMinY)));}
