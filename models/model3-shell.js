// 2018 pre-facelift community exterior reference. See assets/ATTRIBUTION.md.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadModel3Shell() {
  const {scene:model}=await new GLTFLoader().loadAsync(new URL('./assets/model3-2018-debadged.glb',import.meta.url).href);
  const shell=new THREE.Group();shell.name='Model3_2018_debadged_teaching_shell';shell.add(model);
  const exterior=model.getObjectByName('Model3_exterior'),wheelRoot=model.getObjectByName('Model3_wheels');
  if(!exterior||!wheelRoot)throw new Error('Incomplete Model 3 exterior asset');
  const wheelMeshes=new Set(),bodyMaterials=new Set(),wheelMaterials=new Map();
  wheelRoot.traverse(object=>{
    if(!object.isMesh)return;wheelMeshes.add(object);
    const independent=material=>{
      if(!wheelMaterials.has(material))wheelMaterials.set(material,material.clone());
      return wheelMaterials.get(material);
    };
    object.material=Array.isArray(object.material)?object.material.map(independent):independent(object.material);
  });
  shell.traverse(object=>{
    if(!object.isMesh)return;
    object.raycast=()=>{};
    const wheel=wheelMeshes.has(object);
    object.castShadow=wheel;object.receiveShadow=true;object.renderOrder=wheel?0:1;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(wheel){
        material.opacity=1;material.transparent=false;material.depthWrite=true;
        material.envMapIntensity=material.name==='Model3_rubber'?.15:.65;
        if(material.name==='Model3_rubber'){material.color.set('#101613');material.metalness=0;material.roughness=.96;}
      }else{
        material.transparent=true;material.depthWrite=false;material.opacity=.08;
        material.metalness=0;material.roughness=.78;material.envMapIntensity=.15;
        bodyMaterials.add(material);
      }
    }
  });
  shell.userData.setShellMode=(mode,value=.08)=>{
    if(!['solid','xray','hidden'].includes(mode))throw new TypeError('Unknown Model 3 shell mode: '+mode);
    // Brand teaching scenes expose translucent bodywork only. Keep the common
    // API so a legacy solid request cannot introduce an opaque shell here.
    const opacity=mode==='solid'?.08:Number.isFinite(value)?THREE.MathUtils.clamp(value,0,1):.08;
    exterior.visible=mode!=='hidden';
    for(const material of bodyMaterials)material.opacity=opacity;
    shell.userData.shellMode=mode==='hidden'?'hidden':'xray';
    shell.userData.opacity=mode==='hidden'?0:opacity;
  };
  shell.userData.setShellProgress=(mode,opacity=.08)=>shell.userData.setShellMode(mode,opacity);
  shell.userData.setOpacity=opacity=>shell.userData.setShellMode(opacity<=0?'hidden':'xray',opacity);
  shell.userData.setShellVisible=visible=>shell.userData.setShellMode(visible?'xray':'hidden');
  shell.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(shell),size=box.getSize(new THREE.Vector3());
  shell.userData.wheels=['FL','FR','RL','RR'].map(id=>model.getObjectByName('Model3_wheel_'+id));
  shell.userData.wheelCenters=shell.userData.wheels.map(wheel=>wheel.getWorldPosition(new THREE.Vector3()).toArray());
  shell.userData.dimensions={length:size.x,width:size.z,height:size.y,wheelbase:2.9,track:1.72,bottomY:.005};
  shell.userData.displayName='2018 改款前 Model 3 社区去标外观参考';
  shell.userData.sourceYear=2018;shell.userData.solidAllowed=false;
  shell.userData.includesCabin=false;shell.userData.includesWheels=true;
  shell.userData.setShellMode('xray',.08);
  return shell;
}
