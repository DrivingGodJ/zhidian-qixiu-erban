// Original procedural teaching geometry based on the architecture references
// below. Counts, dimensions, tooth profiles and packaging are schematic, not OEM CAD.
import * as THREE from 'three';
import { roundedBox, finishPalette, connector, cable, finishMaterial } from './model-quality.js';
import { motor, inverter, reducer, obc, dcdc, pdu, compressor, thermal, fuelStack, airComp } from './detail.js';

const SOURCE = {
  blade:'https://www.byd.com/eu/blog/BYDs-revolutionary-Blade-Battery-all-you-need-to-know.html',
  catl:'https://www.catl.com/en/news/958.html',
  teslaBattery:'https://www.tesla.com/learn/engineering-tesla-vehicle-batteries-safety-durability-longevity',
  bydDrive:'https://www.byd.com/id/newsroom/byd-kupas-tuntas-teknologi-e-platform-3-0-dan-8-in-1-powertrain',
  teslaMotor:'https://ir.tesla.com/_flysystem/s3/sec/000119312513096241/d452995d10k-gen_0.pdf',
  huawei:'https://www.huawei.com/cn/news/2020/11/huawei-driveone',
  dmi:'https://www.byd.com/es-es/news-list/tecnologia-dmi-dual-mode-prioriza-motor-electrico',
  ths:'https://global.toyota/en/detail/7889139',
  octovalve:'https://service.tesla.com/docs/Model3/ServiceManual/en-us/GUID-20919F82-A219-4B79-B6E6-132F297D8817.html',
  denso:'https://www.denso.com/global/en/products/lineup/pick-up/hpacs/',
  mirai:'https://global.toyota/pages/news/images/2020/12/09/1200/20201209_01_02_en.pdf',
  nexo:'https://www.hyundai.news/de/pressemappen-archiv/nexo-2021/der-hyundai-nexo-pressetext.html'
};
const entry = (part, name, features, source, create, extraParts=[]) => ({part,parts:[part,...extraParts],name,features,source,create});
export const COMPONENT_VARIANTS = Object.freeze({
  'byd-blade':entry('battery','BYD 刀片电池结构','长而薄的方形电芯直接成组，剖开上盖观察长电芯与端部连接。',SOURCE.blade,()=>batteryVariant('blade')),
  'catl-ctp':entry('battery','CATL 麒麟 CTP 3.0 结构','方形电芯直接成组，相邻电芯间布置冷却功能层；不是传统模组箱。',SOURCE.catl,()=>batteryVariant('prismatic')),
  'tesla-4680':entry('battery','Tesla 4680 圆柱电芯结构','圆柱阵列、顶部集流与电芯间连接。',SOURCE.teslaBattery,()=>batteryVariant('cylindrical')),
  'byd-pmsm':entry('motor','BYD 永磁电驱与八合一架构','永磁转子、平行轴减速与扁平集成电力电子功能区。',SOURCE.bydDrive,()=>driveVariant('byd'),['inverter','reducer','obc','dcdc','pdu']),
  'tesla-induction':entry('motor','Tesla 历史交流感应电驱','早期 Model S：铜鼠笼转子、感应电机与独立逆变器。',SOURCE.teslaMotor,()=>driveVariant('induction'),['inverter','reducer']),
  'huawei-driveone':entry('motor','Huawei 2020 DriveONE 七合一','电机、减速器与分层功率电子功能区集成，剖示连接关系。',SOURCE.huawei,()=>driveVariant('huawei'),['inverter','reducer','obc','dcdc','pdu']),
  'byd-dmi-ehs':entry('dht','BYD DM-i EHS 架构','平行轴电机与发电机、单速传动和直接耦合机构。',SOURCE.dmi,()=>hybridVariant('dmi')),
  'toyota-ths':entry('dht','Toyota THS 功率分流原理','太阳轮、行星轮、齿圈与电机/发电机，表达功率分流原理。',SOURCE.ths,()=>hybridVariant('ths')),
  'tesla-octovalve':entry('thermal','Tesla Octovalve 冷却液阀组','集中式八路冷却液阀组；不是完整制冷剂热泵回路。',SOURCE.octovalve,()=>thermalVariant('octovalve')),
  'denso-heatpump':entry('thermal','DENSO 热泵回路架构','电动压缩机、换热器与带阀气液分离器组成分布式制冷剂回路。',SOURCE.denso,()=>thermalVariant('heatpump')),
  'toyota-mirai':entry('fuelStack','Toyota 第二代 Mirai 电堆','2020/2021 架构：层叠板片与前舱电堆、升压器、PCU 集成关系。',SOURCE.mirai,()=>stackVariant('mirai')),
  'hyundai-nexo':entry('fuelStack','Hyundai 2018代 NEXO 电堆','2018 代架构、2021 公开规格：层叠板片阵列与独立空气辅助连接。',SOURCE.nexo,()=>stackVariant('nexo'))
});

function mesh(parent,name,geometry,material,position=[0,0,0]) {
  const object=new THREE.Mesh(geometry,material);object.name=name;object.position.set(...position);
  object.castShadow=object.receiveShadow=true;parent.add(object);return object;
}
const box=(g,name,p,s,mat)=>mesh(g,name,roundedBox(...s),mat,p);
function cylinder(g,name,p,r,h,mat,axis='y',segments=32){
  const object=mesh(g,name,new THREE.CylinderGeometry(r,r,h,segments),mat,p);
  if(axis==='z')object.rotation.x=Math.PI/2;else if(axis==='x')object.rotation.z=Math.PI/2;
  return object;
}
function annulus(g,name,p,outer,inner,h,mat,axis='z'){
  const profile=[[inner,-h/2],[outer,-h/2],[outer,h/2],[inner,h/2],[inner,-h/2]].map(p=>new THREE.Vector2(...p));
  const object=mesh(g,name,new THREE.LatheGeometry(profile,48),mat,p);
  if(axis==='z')object.rotation.x=Math.PI/2;else if(axis==='x')object.rotation.z=Math.PI/2;
  return object;
}
function role(parent,name,assembly,position,scale=1){
  assembly.name='role_'+name;assembly.position.set(...position);assembly.scale.setScalar(scale);parent.add(assembly);return assembly;
}
function packTray(g,f){
  box(g,'cold_plate',[0,-.035,0],[1.9,.06,1.12],f.aluminum);
  for(const side of [-1,1]){
    box(g,'side_rail',[0,.055,side*.55],[1.92,.16,.035],f.steel);
    box(g,'end_rail',[side*.945,.055,0],[.035,.16,1.08],f.steel);
  }
  box(g,'cutaway_lid',[-.72,.22,0],[.42,.035,1.1],f.aluminum);
  connector(g,[-1,.06,.3],.035,.08,f.orange,'x');
  connector(g,[-1,.06,-.3],.035,.08,f.orange,'x');
}
function batteryVariant(kind){
  const g=new THREE.Group(),f=finishPalette();packTray(g,f);
  const cell=new THREE.MeshStandardMaterial({color:0x9fa9ae,metalness:.55,roughness:.42});
  const coolant=new THREE.MeshStandardMaterial({color:0x476c77,metalness:.4,roughness:.5});
  const cellGroup=new THREE.Group();cellGroup.name='cell_array';g.add(cellGroup);
  if(kind==='blade'){
    for(let i=0;i<26;i++){
      const x=-.84+i*.066;
      box(cellGroup,'blade_cell_'+i,[x,.075,0],[.057,.14,1.02],cell);
      for(const z of [-.48,.48])box(g,'blade_terminal',[x,.154,z],[.037,.012,.045],f.copper);
      if(i<25)box(g,'series_busbar',[x+.032,.166,i%2?.48:-.48],[.067,.008,.026],f.copper);
    }
    g.userData.cellForm='long-prismatic';g.userData.sampleCells=26;
  }else if(kind==='prismatic'){
    for(let row=0;row<9;row++)for(let col=0;col<4;col++){
      const x=-.79+row*.194,z=-.39+col*.26;
      box(cellGroup,'prismatic_cell_'+row+'_'+col,[x,.075,z],[.17,.14,.238],cell);
      for(const side of [-1,1])box(g,'cell_terminal',[x+side*.05,.154,z],[.025,.012,.04],f.copper);
    }
    for(let i=0;i<8;i++)box(g,'intercell_cooling_layer_'+i,[-.693+i*.194,.07,0],[.012,.15,1.02],coolant);
    g.userData.cellForm='ctp-prismatic';g.userData.sampleCells=36;g.userData.intercellCoolingLayers=8;
  }else{
    for(let row=0;row<15;row++)for(let col=0;col<8;col++){
      const x=-.82+row*.116,z=-.455+col*.126+(row%2)*.025;
      cylinder(cellGroup,'cylindrical_cell_'+row+'_'+col,[x,.075,z],.046,.16,cell,'y',24);
      cylinder(g,'cell_positive_terminal',[x,.163,z],.023,.008,f.copper,'y',16);
    }
    for(let row=0;row<15;row++)box(g,'collector_strip',[-.82+row*.116,.173,0],[.028,.007,1],f.copper);
    g.userData.cellForm='cylindrical';g.userData.sampleCells=120;
  }
  return g;
}
function inductionMotor(){
  const g=new THREE.Group(),f=finishPalette();
  annulus(g,'open_stator',[0,0,0],.225,.174,.43,f.aluminum);
  cylinder(g,'rotor_lamination',[0,0,0],.125,.36,f.steel,'z');
  cylinder(g,'rotor_shaft',[0,0,0],.035,.59,f.steel,'z');
  for(let i=0;i<24;i++){
    const a=i*Math.PI/12;
    cylinder(g,'squirrel_cage_bar_'+i,[Math.cos(a)*.124,Math.sin(a)*.124,0],.009,.385,f.copper,'z',12);
  }
  for(const z of [-.2,.2]){
    annulus(g,'cage_end_ring',[0,0,z],.14,.112,.018,f.copper);
    annulus(g,'bearing_carrier',[0,0,z*1.16],.22,.15,.025,f.aluminum);
  }
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    const coil=box(g,'stator_coil',[Math.cos(a)*.172,Math.sin(a)*.172,.19],[.05,.024,.085],f.copper);coil.rotation.z=a;
  }
  return g;
}
function logicBoard(){
  const g=new THREE.Group(),f=finishPalette(),pcb=new THREE.MeshStandardMaterial({color:0x285347,metalness:.1,roughness:.7});
  box(g,'control_pcb',[0,0,0],[.14,.008,.1],pcb);
  for(const x of [-.033,.033])for(const z of [-.022,.022])box(g,'control_ic',[x,.01,z],[.025,.013,.022],f.rubber);
  box(g,'low_voltage_header',[0,.012,.052],[.11,.02,.018],f.rubber);
  return g;
}
function driveVariant(kind){
  const g=new THREE.Group(),f=finishPalette(),integrated=kind!=='induction';
  role(g,'motor',kind==='induction'?inductionMotor():motor({r:.22,len:.42}),kind==='huawei'?[0,-.12,-.16]:[-.2,0,0]);
  const gear=role(g,'reducer',reducer(),kind==='huawei'?[.18,-.2,.2]:[.22,-.1,.08],1.15);gear.rotation.y=Math.PI/2;
  role(g,'inverter',inverter(),kind==='induction'?[.18,.4,-.07]:kind==='byd'?[-.12,.35,0]:[0,.22,0],1.3);
  if(integrated){
    role(g,'obc',obc(),kind==='byd'?[.37,.28,-.1]:[0,.51,-.08],.95);
    role(g,'dcdc',dcdc(),kind==='byd'?[.4,.28,.2]:[.28,.5,.12],.8);
    role(g,'pdu',pdu(),kind==='byd'?[-.36,.34,.28]:[-.3,.5,.14],.75);
    if(kind==='byd'){
      role(g,'bms',logicBoard(),[.14,.18,-.23]);
      role(g,'vcu',logicBoard(),[-.34,.12,-.22]);
    }else role(g,'bcu',logicBoard(),[.24,.26,-.24]);
    box(g,'common_casting_bridge',[.03,.08,-.16],[.76,.11,.42],f.aluminum);
    cable(g,[[-.25,.25,.17],[-.28,.19,.26],[-.26,.1,.15]],.014,f.orange);
  }else{
    cable(g,[[-.2,.1,.26],[-.23,.35,.32],[.18,.4,.13]],.014,f.orange);
  }
  g.userData.rotorType=kind==='induction'?'copper-squirrel-cage':'permanent-magnet';
  g.userData.integration=kind==='byd'?8:kind==='huawei'?7:3;
  return g;
}
function gear(g,name,x,y,z,r,teeth,mat,internal=false){
  const shape=new THREE.Shape();
  if(internal)shape.absarc(0,0,r*1.18,0,Math.PI*2,false);
  const outline=internal?new THREE.Path():shape;
  for(let i=0;i<teeth*4;i++){
    const a=i*Math.PI*2/(teeth*4),radius=r*(i%4===0||i%4===3?.88:1);
    const px=Math.cos(a)*radius,py=Math.sin(a)*radius;i?outline.lineTo(px,py):outline.moveTo(px,py);
  }
  outline.closePath();
  if(internal)shape.holes.push(outline);else{const hole=new THREE.Path();hole.absarc(0,0,.025,0,Math.PI*2,true);shape.holes.push(hole);}
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelThickness:.002,bevelSize:.002,bevelSegments:1,steps:1,curveSegments:24});
  geometry.translate(0,0,-.0225);return mesh(g,name,geometry,mat,[x,y,z]);
}
function hybridVariant(kind){
  const g=new THREE.Group(),f=finishPalette();
  box(g,'open_transaxle_base',[0,-.3,-.04],[1.08,.09,.62],f.aluminum);
  if(kind==='dmi'){
    role(g,'generator',motor({r:.135,len:.3}),[-.29,.04,-.1]);
    role(g,'motor',motor({r:.205,len:.34}),[.24,-.015,-.04]);
    gear(g,'generator_gear',-.29,.04,.16,.11,18,f.steel);
    gear(g,'output_gear',.24,-.015,.18,.17,24,f.steel);
    gear(g,'idler_gear',-.035,-.04,.2,.09,16,f.steel);
    annulus(g,'direct_coupling_clutch',[-.31,.24,.19],.105,.05,.08,f.steel);
    cylinder(g,'engine_input',[-.31,.24,.2],.027,.28,f.steel,'z');
    g.userData.transmission='parallel-shaft-direct-coupling';
  }else{
    gear(g,'planetary_ring',0,0,.23,.26,36,f.steel,true);
    gear(g,'sun_gear',0,0,.23,.083,16,f.copper);
    for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3,x=Math.cos(a)*.164,y=Math.sin(a)*.164;
      gear(g,'planet_gear_'+i,x,y,.23,.078,14,f.steel);
      cylinder(g,'planet_carrier_pin',[x,y,.275],.018,.08,f.aluminum,'z');
    }
    annulus(g,'planet_carrier',[0,0,.29],.193,.137,.025,f.aluminum);
    role(g,'generator',motor({r:.13,len:.26}),[-.36,.22,-.08]);
    role(g,'motor',motor({r:.2,len:.32}),[.34,-.12,-.08]);
    cylinder(g,'engine_power_split_input',[0,0,0],.035,.65,f.steel,'z');
    g.userData.transmission='planetary-power-split-principle';
  }
  return g;
}
function thermalVariant(kind){
  const g=new THREE.Group(),f=finishPalette();
  if(kind==='octovalve'){
    const graphite=new THREE.MeshStandardMaterial({color:0x34403a,metalness:.04,roughness:.6});
    box(g,'coolant_manifold',[0,0,0],[.42,.12,.38],graphite);
    cylinder(g,'rotary_valve_actuator',[0,.13,0],.105,.15,graphite);
    cylinder(g,'actuator_lid',[0,.217,0],.09,.025,f.aluminum);
    for(let i=0;i<8;i++){
      const side=i<4?-1:1,z=-.135+(i%4)*.09;
      connector(g,[side*.246,0,z],.028,.085,graphite,'x').name='coolant_port_'+i;
      cable(g,[[side*.28,0,z],[side*.4,.035,z],[side*.46,-.11,z]],.017,f.rubber);
    }
    g.userData.coolantPorts=8;g.userData.thermalScope='coolant-valve';
  }else{
    role(g,'compressor',compressor(),[-.35,-.06,.05],1.3);
    const exchanger=new THREE.Group();role(g,'heat_exchanger',exchanger,[0,.18,-.27]);
    for(const side of [-1,1])box(exchanger,'condenser_header',[side*.37,0,0],[.055,.38,.09],f.aluminum);
    for(let i=0;i<30;i++)box(exchanger,'condenser_fin',[-.335+i*.023,0,0],[.007,.34,.085],f.aluminum);
    cylinder(g,'gas_liquid_separator',[.37,.04,.1],.075,.4,f.aluminum);
    for(const x of [.29,.43]){
      cylinder(g,'integrated_valve',[x,.27,.1],.035,.1,f.rubber);
      connector(g,[x,.33,.1],.021,.035,f.rubber);
    }
    box(g,'electronic_expansion_valve',[.3,-.17,.08],[.1,.075,.1],f.copper);
    for(const [a,b]of [[[-.34,.12,.06],[.35,.27,.1]],[[-.34,-.07,.12],[.29,-.17,.1]],[[.38,-.15,.1],[.2,.08,-.22]]]){
      cable(g,[a,[(a[0]+b[0])/2,Math.max(a[1],b[1])+.13,.22],b],.013,f.aluminum);
    }
    exchanger.userData.function='schematic-heat-exchanger';g.userData.thermalScope='refrigerant-heatpump-loop';
  }
  return g;
}
function stackVariant(kind){
  const g=new THREE.Group(),f=finishPalette(),n=kind==='mirai'?22:30,gap=.017;
  for(let i=0;i<n;i++)box(g,'sample_bipolar_plate_'+i,[(i-(n-1)/2)*gap,0,0],[.012,.34,.49],i%2?f.steel:f.aluminum);
  for(const x of [-1,1]){
    box(g,'stack_endplate',[x*(n*gap/2+.025),0,0],[.04,.39,.54],f.aluminum);
  }
  for(const y of [-.17,.17])for(const z of [-.23,.23])cylinder(g,'compression_tie_rod',[0,y,z],.012,n*gap+.14,f.steel,'x',16);
  if(kind==='mirai'){
    role(g,'boost_converter',dcdc(),[-.04,.3,0],1.3);
    role(g,'power_control_unit',inverter(),[.12,.56,0],1.1);
    box(g,'integrated_support_frame',[0,-.24,0],[.74,.08,.68],f.aluminum);
  }else{
    role(g,'air_supply',airComp(),[.42,-.09,.17],1.2);
    role(g,'power_control_unit',inverter(),[-.16,.35,-.04],1.1);
    box(g,'separate_auxiliary_mount',[.34,-.25,.1],[.48,.07,.54],f.aluminum);
  }
  for(const side of [-1,1]){
    connector(g,[side*.16,.06,.31],.03,.1,f.aluminum,'z');
    cable(g,[[side*.16,.06,.35],[side*.33,.17,.4],[side*.28,.3,.2]],.016,f.rubber);
  }
  g.userData.samplePlates=n;g.userData.stackArchitecture=kind==='mirai'?'2020-second-generation-integrated':'2018-generation-2021-specification';
  return g;
}

export function createComponentVariant(part,variant){
  const spec=COMPONENT_VARIANTS[variant];
  if(!spec)throw new Error('未提供此结构变体：'+variant);
  if(!spec.parts.includes(part))throw new Error('此变体不适用于当前部件：'+part);
  const model=spec.create();model.name=variant;
  model.traverse(object=>{if(object.isMesh)for(const material of Array.isArray(object.material)?object.material:[object.material])finishMaterial(material);});
  model.userData.variant={id:variant,part,name:spec.name,features:spec.features,source:spec.source,scope:'品牌架构参考 · 教学结构示意，非原厂CAD'};
  if(part!==spec.part)model.userData.focusRole='role_'+part;
  return model;
}
