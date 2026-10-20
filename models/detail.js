// ============ 精细零部件建模库 ============
// 每个 builder 返回一个 THREE.Group（多组件组合件），调用时创建独立材质实例，支持单件高亮。
import * as THREE from 'three';
import { qualityGeometry, refineAssembly, finishPalette, fastener, cable, connector, roundedBox } from './model-quality.js';

const M = (color, o = {}) => {
  const copper = color === 0xc9a86a, orange = [0xff9f43,0xffd166].includes(color);
  const source = new THREE.Color(color), dark = Math.max(source.r,source.g,source.b) < .16;
  const pcb = color === 0x22694f, fluid = !!o.alpha;
  return new THREE.MeshStandardMaterial({
    name: copper?'Copper':orange?'HV orange':dark?'Engineering polymer':pcb?'PCB':fluid?'Cutaway fluid':'Cast aluminum',
    color: copper?0xb97b4e:orange?0xe77b32:dark?color:pcb?color:fluid?0x7f9d9c:0x87969f,
    roughness: copper?.34:orange?.5:dark?.78:pcb?.65:Math.max(.4,o.rough??.46),
    metalness: copper?.8:orange?.08:dark?.06:pcb?.12:Math.min(.72,o.metal??.65),
    emissive: o.emissive || 0, emissiveIntensity: Math.min(o.ei||0,.08),
    transparent: !!o.alpha, opacity: o.alpha ?? 1, depthWrite: !o.alpha
  });
};

function bx(g, mat, p, s, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(roundedBox(s[0], s[1], s[2]), mat);
  m.position.set(p[0], p[1], p[2]); m.rotation.set(rx, ry, rz);
  m.castShadow = true; g.add(m); return m;
}
function cy(g, mat, p, r, h, axis = 'y', r2) {
  const m = new THREE.Mesh(qualityGeometry(new THREE.CylinderGeometry(r, r2 ?? r, h, 48)), mat);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  else if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.position.set(p[0], p[1], p[2]); m.castShadow = true; g.add(m); return m;
}
function sp(g, mat, p, r, scale = [1, 1, 1]) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), mat);
  m.position.set(p[0], p[1], p[2]); m.scale.set(scale[0], scale[1], scale[2]);
  m.castShadow = true; g.add(m); return m;
}
function tor(g, mat, p, r, t, axis = 'z') {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 16, 64), mat);
  if (axis === 'x') m.rotation.y = Math.PI / 2;
  else if (axis === 'y') m.rotation.x = Math.PI / 2;
  m.position.set(p[0], p[1], p[2]); g.add(m); return m;
}

// Open service-view casting. All surfaces stay inside the original case box.
function caseShell(g,mat,w,h,d){
  bx(g,mat,[0,-h*.43,0],[w,h*.14,d]);
  bx(g,mat,[0,0,-d*.46],[w,h,d*.08]);
  for(const side of [-1,1])bx(g,mat,[side*w*.46,0,0],[w*.08,h,d]);
  bx(g,mat,[-w*.24,h*.45,-d*.16],[w*.48,h*.1,d*.68]);
}
function ring(g,mat,p,outer,inner,height,axis='z'){
  const geometry=new THREE.LatheGeometry([new THREE.Vector2(inner,-height/2),new THREE.Vector2(outer,-height/2),new THREE.Vector2(outer,height/2),new THREE.Vector2(inner,height/2),new THREE.Vector2(inner,-height/2)],48);
  const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(...p);
  if(axis==='z')mesh.rotation.x=Math.PI/2;else if(axis==='x')mesh.rotation.z=Math.PI/2;
  g.add(mesh);return mesh;
}


// Visible assembly details follow the same dimensions as the teaching primitives.
function complete(g, kind, opt = {}) {
  const f = finishPalette();
  if (kind === 'motor') {
    const r = opt.r || .17, len = opt.len || .34;
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      bx(g,f.aluminum,[Math.cos(a)*r*.995,Math.sin(a)*r*.995,0],[r*.04,r*.04,len*.72],0,0,a);
    }
    for (const side of [-1, 1]) {
      tor(g, f.rubber, [0, 0, side * (len / 2 + .022)], r * .69, r * .035);
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        const points=[
          new THREE.Vector3(Math.cos(a-.09)*r*.78,Math.sin(a-.09)*r*.78,side*len*.31),
          new THREE.Vector3(Math.cos(a-.09)*r*.67,Math.sin(a-.09)*r*.67,side*len*.48),
          new THREE.Vector3(Math.cos(a+.09)*r*.67,Math.sin(a+.09)*r*.67,side*len*.48),
          new THREE.Vector3(Math.cos(a+.09)*r*.78,Math.sin(a+.09)*r*.78,side*len*.31)
        ];
        const winding=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),16,r*.026,8),f.copper);winding.name='stator_end_turn';winding.userData.manufacturingRefined=true;winding.castShadow=true;g.add(winding);
      }
      bx(g, f.aluminum, [side * r * .72, -r * .9, 0], [r * .48, r * .24, len * .72]);
    }
    connector(g, [-.045, r + .09, .045], .022, .07, f.orange);
    cable(g, [[-.045,r+.12,.045],[-.09,r+.18,.1],[-.17,r+.13,.2]], .009, f.orange);
    const tangent=new THREE.Vector3(-.08,-.05,.1).normalize(),end=new THREE.Vector3(-.17,r+.13,.2);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,.024,24),f.rubber);
    cap.name='sealed_phase_harness_end';cap.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tangent);cap.position.copy(end).addScaledVector(tangent,-.008);g.add(cap);
  } else if (['inverter', 'obc', 'dcdc', 'pdu', 'ptc', 'vcu'].includes(kind)) {
    const dims = { inverter: [.38,.16,.3], obc: [.32,.2,.26], dcdc: [.24,.16,.22], pdu: [.3,.18,.24], ptc: [.2,.13,.18], vcu: [.24,.05,.2] }[kind];
    const [w,h,d] = dims;
    for (let i = 0; i < 9; i++) bx(g, f.aluminum, [0,-h*.52,-d*.39+i*d*.098], [w*.87,.025,d*.037]);
    bx(g, f.aluminum, [0,h*.51,-d*.18], [w*.54,.009,d*.35]);
    for (const side of [-1,1]) {
      const plug = connector(g, [side*(w/2+.016),.016,0], .025, .065, kind==='vcu'||(kind==='dcdc'&&side===1)?f.rubber:f.orange, 'x');
      for (let i=0;i<3;i++) cy(plug, f.copper, [-.012+i*.012,.034,0], .0035,.013);
    }
    if (kind === 'pdu') for (let i=0;i<3;i++) {
      bx(g, f.ceramic, [-.08+i*.08,.14,.05], [.029,.033,.03]);
      cy(g, f.copper, [-.08+i*.08,.17,.05], .01,.014);
    }
  } else if (kind === 'compressor' || kind === 'airComp') {
    for (let i=0;i<7;i++) tor(g, f.aluminum, kind==='compressor'?[0,-.06+i*.02,0]:[-.07+i*.023,0,0], kind==='compressor'?.102:.092,.0035,kind==='compressor'?'y':'x');
    for (const side of [-1,1]) bx(g, f.rubber, [side*.085,-.09,0], [.055,.028,.12]);
    connector(g, [.06,.13,-.05],.019,.055,f.orange,'z');
    cable(g, [[.06,.13,-.07],[.09,.17,-.12],[.16,.11,-.15]],.007,f.orange);
  } else if (kind === 'port') {
    tor(g, f.aluminum, [0,0,.063],.056,.005);
    for (let i=0;i<7;i++) {
      const a=i*Math.PI*2/7;
      cy(g,f.copper,[Math.cos(a)*.033,Math.sin(a)*.033,.066],.005,.013,'z');
      tor(g,f.rubber,[Math.cos(a)*.033,Math.sin(a)*.033,.071],.008,.002);
    }
    cy(g,f.steel,[0,.09,-.02],.012,.2,'x');
    bx(g,f.rubber,[0,-.064,.05],[.072,.017,.025]);
  } else if (kind === 'battery') {
    const len=opt.len||1.7, n=opt.modules||5, mw=(len-.3)/n;
    for(let i=0;i<n;i++) {
      const x=-len/2+.2+mw*(i+.5);
      for(const z of [-.28,.28]) bx(g,f.copper,[x,.126,z],[mw*.65,.008,.038]);
      for(let j=0;j<5;j++) bx(g,f.aluminum,[x,.163,-.36+j*.18],[mw*.75,.008,.015]);
    }
    cable(g,[[-len*.44,.17,.43],[-len*.3,.18,.46],[len*.28,.18,.46],[len*.43,.15,.35]],.014,f.orange);
    for(let i=0;i<8;i++) bx(g,f.aluminum,[-len*.43+i*len*.123,-.058,0],[.017,.024,.92]);
    connector(g,[-len/2-.035,.05,-.25],.033,.09,f.orange,'x');
    bx(g,f.orange,[-len/2+.1,.128,.32],[.07,.025,.07]);
  } else if (kind === 'fuelTank') {
    const L=opt.len||.62, w=opt.w||.9;
    cy(g,f.aluminum,[.05,.143,0],.075,.025);
    connector(g,[.05,.17,0],.023,.045,f.rubber);
    cable(g,[[.05,.19,0],[.13,.24,.1],[L*.36,.18,w*.32]],.012,f.rubber);
    for(const x of [-L*.25,L*.25]) for(const z of [-w*.45,w*.45]) fastener(g,x,.15,z,.013,f.steel);
  } else if (kind === 'exhaust') {
    const L=opt.len||2.4,z=opt.z||.52,y=opt.y||.2;
    for(const x of [-L*.35,-L*.2,L*.15,L*.34]) tor(g,f.steel,[x,y,z],.049,.007,'x');
    for(const x of [-L*.28,L*.25]) {
      tor(g,f.aluminum,[x-.13,y,z],.075,.004,'x');
      tor(g,f.aluminum,[x+.13,y,z],.075,.004,'x');
      cable(g,[[x,y+.07,z],[x,y+.2,z],[x+.07,y+.24,z]],.012,f.rubber);
    }
    cy(g,f.rubber,[L/2+.173,y,z],.043,.002,'x');
  } else if (kind === 'phevEngine') {
    for(let i=0;i<4;i++) {
      bx(g,f.rubber,[-.18+i*.12,.347,0],[.07,.025,.12]);
      cy(g,f.ceramic,[-.18+i*.12,.365,0],.014,.025);
      cable(g,[[-.18+i*.12,.37,0],[-.18+i*.12,.4,-.09],[.21,.38,-.15]],.007,f.rubber);
    }
    cy(g,f.rubber,[.16,.356,.12],.037,.028);
    for(let i=0;i<6;i++) bx(g,f.aluminum,[0,-.22,-.18+i*.072],[.48,.045,.008]);
    connector(g,[-.32,.14,-.15],.025,.07,f.aluminum,'x');
    cable(g,[[-.33,.14,-.15],[-.4,.02,-.2],[-.27,-.15,-.23]],.023,f.rubber);
  } else if (kind === 'dht') {
    for(const x of [-.14,-.08,0,.08,.14]) tor(g,f.aluminum,[x,0,0],.192,.006,'x');
    for(let i=0;i<16;i++) {
      const a=i*Math.PI/8;
      bx(g,f.steel,[.251,Math.cos(a)*.064,Math.sin(a)*.064],[.018,.015,.016],a);
    }
    connector(g,[0,.19,0],.022,.055,f.orange);
    bx(g,f.aluminum,[0,-.19,0],[.24,.035,.22]);
  } else if (kind === 'rex') {
    bx(g,f.aluminum,[.04,-.24,0],[.85,.035,.42]);
    for(const x of [-.31,.3]) for(const z of [-.15,.15]) cy(g,f.rubber,[x,-.265,z],.033,.035);
    cable(g,[[.12,.13,-.15],[.08,.3,-.21],[-.19,.3,-.18]],.014,f.orange);
  } else if (kind === 'fuelStack') {
    for(const x of [-.21,.21]) for(const y of [-.16,.16]) for(const z of [-.24,.24]) fastener(g,x,y,z,.017,f.steel,'x');
    connector(g,[0,.12,.345],.026,.06,f.aluminum,'z');
    connector(g,[0,-.12,.345],.026,.06,f.aluminum,'z');
    bx(g,f.aluminum,[0,-.19,0],[.46,.035,.4]);
  } else if (kind === 'h2tanks') {
    const n=opt.n||3,r=opt.r||.17,len=opt.len||.95,gap=opt.gap||.42;
    for(let i=0;i<n;i++) {
      const z=-((n-1)/2)*gap+i*gap;
      connector(g,[len/2+.02,.1,z],.025,.09,f.aluminum);
      for(const x of [-len*.18,len*.18]) {
        tor(g,f.rubber,[x,0,z],r+.008,.011,'x');
        bx(g,f.aluminum,[x,-r-.025,z],[.075,.04,r*1.7]);
      }
    }
  } else if (kind === 'h2line') {
    const len=opt.len||1.3;
    for(const x of [-len*.4,len*.38]) connector(g,[x,0,0],.042,.07,f.aluminum,'x');
    for(const x of [-len*.28,len*.1]) {
      tor(g,f.rubber,[x,0,0],.033,.005,'x');
      bx(g,f.aluminum,[x,-.047,0],[.065,.022,.11]);
    }
    cy(g,f.aluminum,[-len/2+.06,.09,0],.035,.018);
    cy(g,f.rubber,[-len/2+.06,.102,0],.025,.006);
  }
  return refineAssembly(g);
}

/* ---------- 通用件 ---------- */

// 驱动电机：定子+转子+端盖+接线盒+冷却套
export function motor(opt = {}) {
  const g = new THREE.Group();
  const stator = M(0x3d5a80), rotor = M(0x66717d, { metal: 0.72, rough: 0.4 }),
    endCap = M(0x8a93a6), box = M(0x2b3446), cool = M(0x66d9e8, { alpha: 0.5, emissive: 0x1c6f80, ei: 0.5 });
  const r = opt.r || 0.17, len = opt.len || 0.34;
  ring(g,stator,[0,0,0],r,r*.76,len);                       // 真正中空的定子壳
  cy(g,rotor,[0,0,0],r*.55,len*.86,'z');
  cy(g,endCap,[0,0,0],r*.18,len*1.15,'z');                 // 输出轴
  ring(g,endCap,[0,0,len/2],r*.92,r*.6,.04);
  ring(g,endCap,[0,0,-len/2],r*.92,r*.6,.04);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    const magnet=bx(g,box,[Math.cos(a)*r*.52,Math.sin(a)*r*.52,0],[r*.16,r*.08,len*.72]);magnet.rotation.z=a+Math.PI/2;
  }
  bx(g, box, [0, r + 0.03, 0], [0.14, 0.08, 0.16]);         // 接线盒
  tor(g, cool, [0, 0, len * 0.2], r + 0.015, 0.012);        // 冷却环
  tor(g, cool, [0, 0, -len * 0.2], r + 0.015, 0.012);
  return complete(g, 'motor', opt);
}

// 电机控制器：壳体+散热鳍片+母线电容+连接器
export function inverter() {
  const g = new THREE.Group();
  const shell = M(0x46618c), fin = M(0x2b3446), cap = M(0x2fd6a8, { emissive: 0x0a5c50, ei: 0.6 }),
    conn = M(0xff9f43), cu = M(0xc9a86a, { metal: 0.9, rough: 0.25 });
  caseShell(g,shell,.38,.16,.3);
  bx(g,M(0x22694f),[0,-.045,0],[.3,.012,.21]);
  for(let i=0;i<3;i++)bx(g,cu,[-.09+i*.08,.008,.05],[.055,.014,.08]);
  for (let i = 0; i < 4; i++) bx(g, fin, [0, -0.085, -0.12 + i * 0.08], [0.34, 0.03, 0.02]); // 散热鳍片
  cy(g, cap, [0.12, 0.1, 0], 0.035, 0.12);                  // 母线电容
  cy(g, cu, [-0.12, 0.1, 0.06], 0.028, 0.1);
  bx(g, conn, [0.2, 0.02, 0], [0.06, 0.08, 0.2]);           // 高压连接器
  bx(g, conn, [-0.2, 0.02, 0], [0.06, 0.08, 0.14]);
  return complete(g, 'inverter', {});
}

// 车载充电机 OBC
export function obc() {
  const g = new THREE.Group();
  const shell = M(0x5b6b8c), fin = M(0x2b3446), conn = M(0xffd166), coil = M(0xc9a86a, { metal: 0.85, rough: 0.3 });
  caseShell(g,shell,.32,.2,.26);
  bx(g,M(0x22694f),[0,-.06,0],[.27,.012,.2]);
  for (let i = 0; i < 3; i++) bx(g, fin, [0, -0.11, -0.08 + i * 0.08], [0.28, 0.025, 0.02]);
  cy(g, coil, [0.08, 0.13, 0], 0.045, 0.09);                 // 变压器磁芯
  bx(g, conn, [-0.17, 0.02, 0], [0.05, 0.09, 0.16]);        // 交流进线座
  bx(g, conn, [0.17, 0.02, 0], [0.05, 0.09, 0.16]);         // 直流出线座
  return complete(g, 'obc', {});
}

// DC-DC 转换器
export function dcdc() {
  const g = new THREE.Group();
  const shell = M(0x3f7f74), conn = M(0xffd166), core = M(0xc9a86a, { metal: 0.85, rough: 0.3 });
  caseShell(g,shell,.24,.16,.22);
  bx(g,M(0x22694f),[0,-.04,0],[.19,.012,.16]);
  tor(g, core, [0, 0.11, 0], 0.05, 0.018, 'y');             // 环形电感
  bx(g, conn, [0.13, 0.02, 0], [0.04, 0.07, 0.12]);
  bx(g, conn, [-0.13, 0.02, 0], [0.04, 0.07, 0.12]);
  return complete(g, 'dcdc', {});
}

// 高压配电盒 PDU
export function pdu() {
  const g = new THREE.Group();
  const shell = M(0x8a6a3c), fuse = M(0xff6b6b), bar = M(0xc9a86a, { metal: 0.9, rough: 0.25 }), lid = M(0x5c4626);
  caseShell(g,shell,.3,.18,.24);
  bx(g,lid,[-.075,.1,-.06],[.11,.03,.08]);
  for(const x of [-.08,.08])bx(g,M(0x232a36),[x,.035,-.055],[.065,.085,.065]);
  for (let i = 0; i < 3; i++) cy(g, fuse, [-0.08 + i * 0.08, 0.13, 0.05], 0.018, 0.07); // 熔断器
  bx(g, bar, [0, 0.13, -0.05], [0.22, 0.02, 0.03]);         // 铜排
  return complete(g, 'pdu', {});
}

// PTC 加热器
export function ptc() {
  const g = new THREE.Group();
  const shell = M(0xa8503c), pipe = M(0x9aa4b5), glow = M(0xff8c5a, { emissive: 0xd94f04, ei: 0.9 });
  caseShell(g,shell,.2,.13,.18);
  cy(g, glow, [0, 0, 0], 0.045, 0.15, 'x');                 // PTC 芯
  cy(g, pipe, [0, 0.02, 0.11], 0.025, 0.06, 'z');           // 进出水口
  cy(g, pipe, [0, 0.02, -0.11], 0.025, 0.06, 'z');
  bx(g, M(0x2b3446), [0.11, 0, 0], [0.04, 0.08, 0.12]);     // 接插件
  return complete(g, 'ptc', {});
}

// 电动压缩机：涡旋壳体+电机段+高低压管
export function compressor() {
  const g = new THREE.Group();
  const body = M(0x7d94b5), dark = M(0x2b3446), pipeH = M(0xff6b6b), pipeL = M(0x5aa0ff);
  cy(g, body, [0, 0, 0], 0.1, 0.16, 'y');                   // 电机段
  cy(g, dark, [0, 0.1, 0], 0.085, 0.06, 'y');               // 涡旋盖
  bx(g, dark, [0, 0.15, 0], [0.16, 0.04, 0.14]);            // 顶盖
  cy(g, pipeH, [0.09, 0.06, 0], 0.018, 0.08, 'x');          // 高压管
  cy(g, pipeL, [-0.09, -0.02, 0], 0.018, 0.08, 'x');        // 低压管
  return complete(g, 'compressor', {});
}

// 整车控制器 VCU
export function vcu() {
  const g = new THREE.Group();
  const shell = M(0x4c3f8a), conn = M(0x2b3446), led = M(0x2fd6a8, { emissive: 0x0fbf9f, ei: 1.2 });
  bx(g, shell, [0, 0, 0], [0.24, 0.05, 0.2]);
  for (let i = 0; i < 3; i++) bx(g, conn, [-0.08 + i * 0.08, -0.02, 0.11], [0.05, 0.035, 0.04]); // 接插件排
  cy(g, led, [0.09, 0.03, -0.06], 0.01, 0.015);
  return complete(g, 'vcu', {});
}

// 充电口/加氢口总成
export function port(opt = {}) {
  const g = new THREE.Group();
  const body = M(opt.color || 0xffd166), socket = M(0x14181f, { rough: 0.8 }), flap = M(0x3d5a80, { metal: 0.3 });
  bx(g, body, [0, 0, 0], [0.26, 0.18, 0.08]);
  cy(g, socket, [0, 0, 0.045], 0.055, 0.03, 'z');           // 插座/加氢嘴
  bx(g, flap, [0, 0.11, -0.02], [0.24, 0.02, 0.1], -0.5);   // 翻盖
  return complete(g, 'port', opt);
}

// 动力电池包：托盘+模组×N+BMS+维修开关+冷却进出口
export function battery(opt = {}) {
  const g = new THREE.Group();
  const len = opt.len || 1.7, n = opt.modules || 5;
  const tray = M(0x2b3446), mod = M(0x2f6fed, { metal: 0.3, rough: 0.4 }),
    bms = M(0xb08cff), sw = M(0xff6b6b), cool = M(0x66d9e8, { emissive: 0x1c6f80, ei: 0.7 });
  bx(g,tray,[0,-.025,0],[len,.05,1]);                       // 浅盘，不再用实心盒遮住模组
  for(const z of [-.48,.48])bx(g,tray,[0,.055,z],[len,.11,.04]);
  bx(g,tray,[0,.14,-.395],[len*.98,.04,.17]);               // 局部剖开的上盖
  const mw = (len - 0.3) / n;
  for (let i = 0; i < n; i++)                               // 电芯模组
    bx(g, mod, [-len / 2 + 0.2 + mw * (i + 0.5), 0.07, 0], [mw * 0.88, 0.1, 0.8]);
  bx(g, bms, [len / 2 - 0.12, 0.07, -0.3], [0.2, 0.08, 0.25]); // BMS
  bx(g, sw, [-len / 2 + 0.1, 0.07, 0.32], [0.1, 0.08, 0.12]);  // 维修开关
  cy(g, cool, [-len / 2 - 0.04, 0.02, 0.3], 0.022, 0.1, 'x');  // 冷却管
  cy(g, cool, [len / 2 + 0.04, 0.02, 0.3], 0.022, 0.1, 'x');
  return complete(g, 'battery', opt);
}

// 油箱：桶体+固定带+加油管
export function fuelTank(opt = {}) {
  const g = new THREE.Group();
  const L = opt.len || 0.62, Wd = opt.w || 0.9;
  const body = M(0xb8a03c, { metal: 0.3, rough: 0.55 }), strap = M(0x2b3446), pipe = M(0x9aa4b5);
  bx(g, body, [0, 0, 0], [L, 0.26, Wd]);
  sp(g, body, [L / 2, 0, 0], Wd / 2, [0.4, 0.13 / (Wd / 2), 1]);
  sp(g, body, [-L / 2, 0, 0], Wd / 2, [0.4, 0.13 / (Wd / 2), 1]);
  bx(g, strap, [L * 0.25, 0, 0], [0.04, 0.29, Wd * 1.02]); // 固定带
  bx(g, strap, [-L * 0.25, 0, 0], [0.04, 0.29, Wd * 1.02]);
  cy(g, pipe, [0, 0.16, Wd / 2 + 0.06], 0.025, 0.16, 'z'); // 加油管
  return complete(g, 'fuelTank', opt);
}

// 排气系统：歧管+前管+消音器+尾喉
export function exhaust(opt = {}) {
  const g = new THREE.Group();
  const pipe = M(0x9aa4b5, { metal: 0.7, rough: 0.4 }), muff = M(0x6f7a8c), tip = M(0xcfd8e6, { metal: 0.9, rough: 0.2 });
  const L = opt.len || 2.4, z = opt.z || 0.52, y = opt.y || 0.2;
  cy(g, pipe, [0, y, z], 0.045, L, 'x');                    // 主排气管
  cy(g, muff, [L * 0.25, y, z], 0.09, 0.5, 'x');            // 主消音器
  cy(g, muff, [-L * 0.28, y + 0.02, z], 0.07, 0.34, 'x');   // 副消音器
  cy(g, tip, [L / 2 + 0.1, y, z], 0.055, 0.14, 'x');        // 尾喉
  return complete(g, 'exhaust', opt);
}

/* ---------- 插混专用 ---------- */

// 混动专用发动机：缸体+缸盖+气门室盖+油底壳+进气歧管+排气歧管+皮带轮
export function phevEngine() {
  const g = new THREE.Group();
  const block = M(0x5c6678), head = M(0x7a8496), cover = M(0x3f4b60), pan = M(0x2f3846),
    alum = M(0x9aa4b5, { metal: 0.7, rough: 0.35 }), dark = M(0x232a36), belt = M(0x14181f, { rough: 0.9, metal: 0 });
  bx(g, block, [0, 0, 0], [0.6, 0.34, 0.52]);               // 缸体
  bx(g, head, [0, 0.21, 0], [0.56, 0.1, 0.48]);             // 缸盖
  bx(g, cover, [0, 0.3, 0], [0.5, 0.07, 0.42]);             // 气门室盖
  bx(g, pan, [0, -0.22, 0], [0.5, 0.12, 0.44]);             // 油底壳
  for (let i = 0; i < 4; i++)                                 // 进气歧管支管
    cy(g, alum, [0.12, 0.05, -0.14 + i * 0.095], 0.028, 0.24, 'x');
  bx(g, alum, [0.27, 0.05, 0], [0.08, 0.12, 0.42]);         // 进气稳压腔
  cy(g, dark, [-0.31, 0.08, 0.1], 0.03, 0.3, 'z');          // 排气歧管
  cy(g, belt, [0.31, 0.12, -0.16], 0.07, 0.03, 'x');        // 曲轴皮带轮
  tor(g, M(0x8a93a6), [0.31, 0.06, -0.05], 0.09, 0.015, 'x'); // 发电机/空调皮带示意
  return complete(g, 'phevEngine', {});
}

// DHT 混动专用变速箱：壳体+离合器鼓+齿轮组+内置电机+减速器
export function dht() {
  const g = new THREE.Group();
  const housing = M(0x5a6478), drum = M(0x7a8496, { metal: 0.7, rough: 0.35 }),
    gear = M(0xc9a86a, { metal: 0.9, rough: 0.25 }), stator = M(0x3d5a80),
    dark = M(0x232a36), cool = M(0x66d9e8, { emissive: 0x1c6f80, ei: 0.6 });
  ring(g,housing,[0,0,0],.19,.169,.34,'x');                // 剖示空腔，不遮住离合器与齿轮
  cy(g, drum, [-0.1, 0, 0], 0.145, 0.12, 'x');              // 离合器鼓
  for (let i = 0; i < 3; i++)                                 // 行星齿轮组
    cy(g, gear, [0.02 + i * 0.07, 0, 0], 0.1 - i * 0.022, 0.035, 'x');
  cy(g, stator, [0.14, 0, 0], 0.165, 0.1, 'x');             // 内置驱动电机定子
  cy(g, dark, [0.14, 0, 0], 0.12, 0.12, 'x');               // 转子腔
  cy(g, drum, [0.22, 0, 0], 0.08, 0.06, 'x');               // 减速器输出
  tor(g, cool, [0, 0, 0], 0.2, 0.012, 'x');                 // 冷却水道
  return complete(g, 'dht', {});
}

/* ---------- 增程专用 ---------- */

// 增程器总成：发动机 + 发电机同轴一体化
export function rex() {
  const g = new THREE.Group();
  const eng = phevEngine();
  eng.scale.set(0.85, 0.85, 0.85);
  eng.position.set(-0.18, 0, 0);
  g.add(eng);
  const gen = motor({ r: 0.16, len: 0.3 });
  gen.rotation.y = Math.PI / 2;                                // 转为 x 轴向
  gen.position.set(0.32, 0, 0);
  g.add(gen);
  const fly = M(0x232a36);
  cy(g, fly, [0.08, 0, 0], 0.14, 0.05, 'x');                 // 飞轮壳
  return complete(g, 'rex', {});
}

/* ---------- 氢燃料专用 ---------- */

// 燃料电池堆：端板+双极板组+集流板+拉杆
export function fuelStack() {
  const g = new THREE.Group();
  const plate = M(0x2fd6a8, { metal: 0.4, rough: 0.35 }), cell = M(0x9aa4b5, { metal: 0.8, rough: 0.3 }),
    collector = M(0xc9a86a, { metal: 0.9, rough: 0.2 }), rod = M(0x2b3446),
    h2 = M(0x66d9e8, { emissive: 0x1c6f80, ei: 0.7 }), o2 = M(0xff8c5a, { emissive: 0xd94f04, ei: 0.6 });
  const n = 16, gap = 0.014;
  bx(g, collector, [-n * gap / 2 - 0.04, 0, 0], [0.05, 0.3, 0.52]); // 负极集流板
  bx(g, collector, [n * gap / 2 + 0.04, 0, 0], [0.05, 0.3, 0.52]);  // 正极集流板
  bx(g, plate, [-n * gap / 2 - 0.09, 0, 0], [0.05, 0.34, 0.56]);    // 端板×2
  bx(g, plate, [n * gap / 2 + 0.09, 0, 0], [0.05, 0.34, 0.56]);
  for (let i = 0; i < n; i++)                                  // 双极板+膜电极组
    bx(g, cell, [-((n - 1) / 2) * gap + i * gap, 0, 0], [0.011, 0.28, 0.48]);
  [[0.16, 0.24], [0.16, -0.24], [-0.16, 0.24], [-0.16, -0.24]].forEach(([y, z]) =>
    cy(g, rod, [0, y, z], 0.012, n * gap + 0.24, 'x'));        // 长拉杆
  cy(g, h2, [0, 0.12, 0.3], 0.028, 0.1, 'z');                  // 氢气进口
  cy(g, o2, [0, -0.12, 0.3], 0.028, 0.1, 'z');                 // 空气进口
  return complete(g, 'fuelStack', {});
}

// 储氢罐组：罐体×N（胶囊体+封头+瓶阀+固定箍）
export function h2tanks(opt = {}) {
  const g = new THREE.Group();
  const n = opt.n || 3, r = opt.r || 0.17, len = opt.len || 0.95, gap = opt.gap || 0.42;
  const body = M(0x232a36, { metal: 0.08, rough: 0.65 }),
    wrap = M(0x232a36, { metal: 0.05, rough: 0.65 }), valve = M(0xff6b6b), strap = M(0x2b3446);
  for (let i = 0; i < n; i++) {
    const z = -((n - 1) / 2) * gap + i * gap;
    const cap = new THREE.Mesh(new THREE.CapsuleGeometry(r, len - 2 * r, 12, 40), body);
    cap.rotation.z = Math.PI / 2; cap.position.set(0, 0, z); cap.castShadow = true; g.add(cap);
    tor(g, wrap, [-len * 0.18, 0, z], r + 0.008, 0.014, 'x');  // 碳纤维缠绕环带
    tor(g, wrap, [len * 0.18, 0, z], r + 0.008, 0.014, 'x');
    cy(g, valve, [len / 2 + 0.02, 0.1, z], 0.028, 0.08);       // 瓶阀
    bx(g, strap, [0, -r + 0.01, z], [0.3, 0.04, 0.06]);        // 固定箍
  }
  cy(g, M(0x66d9e8, { emissive: 0x1c6f80, ei: 0.7 }), [len / 2 + 0.02, 0.1, 0], 0.02, gap * (n - 1) + 0.1, 'z'); // 汇流管
  return complete(g, 'h2tanks', opt);
}

// 空压机+加湿器（燃料电池空气供给）
export function airComp() {
  const g = new THREE.Group();
  const volute = M(0x7a8496, { metal: 0.7, rough: 0.35 }), motor = M(0x3d5a80),
    humid = M(0x9fc2ef, { alpha: 0.55, rough: 0.2 }), pipe = M(0xff8c5a, { emissive: 0xd94f04, ei: 0.5 });
  cy(g, motor, [0, 0, 0], 0.09, 0.18, 'x');                   // 高速电机
  sp(g, volute, [0.14, 0, 0], 0.11, [0.45, 1, 1]);          // 蜗壳
  cy(g, humid, [0.02, 0.13, 0], 0.06, 0.14, 'z');           // 膜加湿器
  cy(g, pipe, [0.22, 0.06, 0], 0.02, 0.12, 'x');            // 出气管
  return complete(g, 'airComp', {});
}

// 供氢管路+氢循环泵
export function h2line(opt = {}) {
  const g = new THREE.Group();
  const pipe = M(0x66d9e8, { metal: 0.6, rough: 0.3, emissive: 0x124a5c, ei: 0.5 }),
    pump = M(0x3f7f74), dark = M(0x232a36);
  const len = opt.len || 1.3;
  cy(g, pipe, [0, 0, 0], 0.032, len, 'x');                    // 高压供氢主管
  cy(g, pump, [len * 0.2, 0.06, 0], 0.055, 0.12);           // 氢循环泵
  cy(g, dark, [len * 0.2, 0.13, 0], 0.03, 0.05);
  cy(g, pipe, [len * 0.2, 0.1, 0.09], 0.02, 0.16, 'z');     // 回流支管
  cy(g, M(0xff6b6b), [-len / 2 + 0.06, 0.04, 0], 0.045, 0.06, 'y'); // 减压阀
  return complete(g, 'h2line', opt);
}


/* ---------- 纯电平台补充件 ---------- */

// BMS：主控板、隔离采样通道、均衡电路与低压排针。
export function bms() {
  const g = new THREE.Group(), f = finishPalette();
  const pcb = M(0x22694f, { metal: .2, rough: .5 }), chip = M(0x18222a, { metal: .12, rough: .65 });
  bx(g, f.aluminum, [0,-.045,0], [.4,.055,.3]);
  bx(g, pcb, [0,0,0], [.37,.015,.27]);
  bx(g, chip, [-.075,.023,0], [.11,.025,.1]);
  for (let i=0;i<8;i++) {
    const z=-.1+i*.028;
    bx(g,f.copper,[-.147,.012,z],[.046,.003,.005]);
    bx(g,f.copper,[-.003,.012,z],[.035,.003,.005]);
    for (const side of [-1,1]) bx(g,f.steel,[-.075+side*.064,.02,z*.45],[.018,.005,.006]);
  }
  for (let i=0;i<4;i++) {
    bx(g,chip,[.09,.024,-.09+i*.06],[.04,.026,.035]);
    cy(g,f.aluminum,[.14,.032,-.09+i*.06],.011,.04);
  }
  bx(g,f.rubber,[0,.02,.151],[.29,.04,.03]);
  for(let i=0;i<14;i++) cy(g,f.copper,[-.13+i*.02,.02,.174],.003,.02,'z');
  for(const x of [-.16,.16]) for(const z of [-.11,.11]) fastener(g,x,.016,z,.009,f.steel);
  return refineAssembly(g);
}

// 热管理：冷却模块、双风扇、储液罐、分流阀及成对软管。
export function thermal() {
  const g = new THREE.Group(), f=finishPalette(), blue=M(0x388aae,{metal:.3,rough:.4});
  bx(g,f.rubber,[0,0,0],[.64,.35,.1]);
  for(let i=0;i<23;i++) bx(g,f.aluminum,[-.285+i*.026,0,0],[.007,.3,.105]);
  for(const x of [-.16,.16]) {
    tor(g,f.rubber,[x,0,.067],.133,.018);
    cy(g,f.steel,[x,0,.077],.035,.035,'z');
    for(let i=0;i<7;i++) {
      const a=i*Math.PI*2/7;
      const profile=new THREE.Shape();profile.moveTo(.028,-.012);profile.quadraticCurveTo(.08,-.06,.128,-.024);profile.lineTo(.115,.022);profile.quadraticCurveTo(.07,.015,.028,.014);profile.closePath();
      const blade=new THREE.Mesh(new THREE.ExtrudeGeometry(profile,{depth:.009,bevelEnabled:true,bevelThickness:.002,bevelSize:.002,bevelSegments:1,steps:1,curveSegments:4}),f.rubber);
      blade.position.set(x,0,.07);blade.rotation.z=a;blade.name='curved_fan_blade';g.add(blade);
    }
  }
  const reservoir=M(0xcce1df,{metal:.05,rough:.3,alpha:.7});
  cy(g,reservoir,[.38,.08,0],.066,.23);
  cy(g,blue,[.38,.04,0],.058,.14);
  cy(g,f.rubber,[.38,.211,0],.045,.03);
  bx(g,blue,[-.38,-.04,0],[.1,.12,.12]);
  cable(g,[[-.38,.02,.02],[-.4,.21,.08],[-.22,.22,.02],[-.25,.15,0]],.016,f.rubber);
  cable(g,[[.38,-.03,.02],[.38,-.22,.09],[.16,-.22,.06],[.2,-.15,0]],.016,f.rubber);
  connector(g,[-.38,-.12,0],.025,.06,f.aluminum);
  return refineAssembly(g);
}

// 单级减速器：压铸壳体、加强筋、差速器输出与可见传动齿圈。
export function reducer() {
  const g=new THREE.Group(),f=finishPalette();
  cy(g,f.aluminum,[0,0,0],.2,.29,'x');
  cy(g,f.aluminum,[.02,-.13,0],.14,.34,'x');
  for(let i=0;i<7;i++) {
    const a=i*Math.PI*2/7;
    bx(g,f.steel,[0,Math.cos(a)*.197,Math.sin(a)*.197],[.26,.018,.018],a);
  }
  for(const side of [-1,1]) {
    cy(g,f.steel,[side*.2,-.13,0],.07,.12,'x');
    for(let i=0;i<10;i++) tor(g,f.steel,[side*(.17+i*.008),-.13,0],.065,.002,'x');
    tor(g,f.rubber,[side*.172,-.13,0],.075,.006,'x');
  }
  cy(g,f.steel,[.165,.045,0],.105,.018,'x');
  for(let i=0;i<22;i++) {
    const a=i*Math.PI/11;
    bx(g,f.steel,[.169,.045+Math.cos(a)*.108,Math.sin(a)*.108],[.024,.016,.019],a);
  }
  cy(g,f.aluminum,[.19,.045,0],.035,.04,'x');
  connector(g,[0,.21,0],.022,.035,f.rubber);
  bx(g,f.aluminum,[0,-.275,0],[.26,.035,.16]);
  return refineAssembly(g);
}

// 车轮总成：双五辐轮圈、胎肩花纹、通风制动盘与制动卡钳。
export function wheel() {
  const g=new THREE.Group(),f=finishPalette(),red=M(0xae4037,{metal:.25,rough:.4});
  const tyre=tor(g,f.rubber,[0,0,0],.282,.072,'x');tyre.scale.z=.9;
  ring(g,f.aluminum,[0,0,0],.232,.207,.14,'x');              // 开放轮圈，辐条间保留真实空隙
  cy(g,f.rubber,[.073,0,0],.218,.003,'x');
  cy(g,f.steel,[.078,0,0],.192,.009,'x');
  for(let i=0;i<24;i++) {
    const a=i*Math.PI/12;
    cy(g,f.rubber,[.084,Math.cos(a)*.166,Math.sin(a)*.166],.005,.002,'x');
    cy(g,f.rubber,[.084,Math.cos(a+.08)*.143,Math.sin(a+.08)*.143],.004,.002,'x');
  }
  for(let i=0;i<5;i++) for(const split of [-1,1]) {
    const a=i*Math.PI*2/5+split*.09;
    bx(g,f.aluminum,[.1,Math.cos(a)*.12,Math.sin(a)*.12],[.028,.19,.021],a+Math.PI/2);
  }
  cy(g,f.aluminum,[.112,0,0],.06,.034,'x');
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;fastener(g,.135,Math.cos(a)*.04,Math.sin(a)*.04,.008,f.steel,'x');
  }
  tor(g,f.aluminum,[.094,0,0],.224,.009,'x');
  bx(g,red,[.072,.12,.09],[.075,.14,.085],.6);
  for(let i=0;i<56;i++) {
    const a=i*Math.PI/28;
    for(const side of [-1,1]) bx(g,f.rubber,[side*.041,Math.cos(a)*.347,Math.sin(a)*.347],[.045,.009,.025],a,side*.35);
  }
  return refineAssembly(g);
}

// 座舱：带分缝的座椅、仪表台、方向盘与中央扶手。
export function cabin() {
  const g=new THREE.Group(),f=finishPalette(),leather=M(0x39464e,{metal:.03,rough:.82}),trim=M(0x71858b,{metal:.6,rough:.3});
  bx(g,f.rubber,[0,-.12,0],[1.04,.08,1.38]);
  function seat(x,z){
    bx(g,leather,[x,0,z],[.34,.13,.4]);
    bx(g,leather,[x,.26,z+.16],[.34,.44,.1],-.13);
    bx(g,leather,[x,.52,z+.14],[.19,.15,.09]);
    for(const side of [-1,1]){
      bx(g,leather,[x+side*.145,.065,z],[.055,.08,.33]);
      bx(g,leather,[x+side*.145,.27,z+.12],[.055,.36,.08],-.13);
      cy(g,f.steel,[x+side*.05,.437,z+.14],.008,.09);
    }
    for(let i=0;i<5;i++)bx(g,trim,[x-.11+i*.055,.067,z],[.002,.002,.29]);
    for(const side of [-1,1])bx(g,f.steel,[x+side*.11,-.085,z],[.025,.026,.44]);
  }
  seat(-.26,-.05);seat(.26,-.05);
  bx(g,leather,[0,.015,.49],[.94,.14,.32]);
  bx(g,leather,[0,.23,.62],[.94,.34,.1],-.13);
  bx(g,leather,[0,.24,-.62],[1.02,.2,.21]);
  bx(g,trim,[0,.35,-.6],[.92,.012,.05]);
  bx(g,f.rubber,[.06,.405,-.56],[.27,.18,.016],-.12);
  bx(g,M(0x13252b,{metal:.1,rough:.25,emissive:0x2f706f,ei:.25}),[.06,.405,-.549],[.245,.155,.003],-.12);
  tor(g,leather,[-.27,.36,-.48],.104,.015);
  cy(g,f.rubber,[-.27,.36,-.48],.035,.04,'z');
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3;
    bx(g,trim,[-.27+Math.cos(a)*.049,.36+Math.sin(a)*.049,-.48],[.08,.012,.012],0,0,a);
  }
  bx(g,leather,[0,.06,-.06],[.12,.18,.46]);
  for(const z of [-.19,-.08])tor(g,f.rubber,[0,.158,z],.035,.005,'y');
  return refineAssembly(g);
}

/* ---------- 注册表 ---------- */
export const BUILDERS = {
  motor, inverter, obc, dcdc, pdu, ptc, compressor, vcu, port,
  battery, fuelTank, exhaust, phevEngine, dht, rex,
  fuelStack, h2tanks, airComp, h2line, bms, thermal, reducer, wheel, cabin
};
