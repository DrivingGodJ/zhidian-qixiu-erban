// ============ 车型对比 3D 模型 · 共享引擎 ============
// 依赖 window.MODEL_CFG（由各 cfg-*.js 提供）
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BUILDERS } from './detail.js';

const CFG = window.MODEL_CFG;
// 嵌入模式（体系课 iframe 调用）：?embed=1 隐藏顶栏/提示/信息卡；?labels=0 关闭备注
const Q = new URLSearchParams(location.search);
const EMBED = Q.get('embed') === '1';
if (EMBED) {
  document.querySelectorAll('.topbar,.hint,#partCard').forEach(el => el.style.display = 'none');
}
const wrap = document.getElementById('stage');
const W = () => wrap.clientWidth, H = () => wrap.clientHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070d1a);
scene.fog = new THREE.Fog(0x070d1a, 14, 34);

const camera = new THREE.PerspectiveCamera(46, W() / H(), 0.1, 100);
// 基础取景位置（桌面）；窄屏按宽高比拉远
const CAM_WHOLE = new THREE.Vector3(5.4, 2.3, 4.8);
const CAM_UNDER = new THREE.Vector3(3.4, 0.55, 3.4);
function frameFactor() {
  const a = W() / H();
  return a < 0.7 ? 1.85 : a < 1 ? 1.5 : a < 1.4 ? 1.18 : 1;
}
camera.position.copy(CAM_WHOLE).multiplyScalar(frameFactor());

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W(), H());
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
wrap.appendChild(renderer.domElement);

// 简易环境反射（让金属件有质感，不依赖外部 HDR）
const pmrem = new THREE.PMREMGenerator(renderer);
{
  const env = new THREE.Scene();
  const top = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x8fb8ff, side: THREE.BackSide }));
  top.position.y = 4; env.add(top);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(10, 24),
    new THREE.MeshBasicMaterial({ color: 0x0a1224 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2; env.add(floor);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  lamp.position.set(4, 6, 3); env.add(lamp);
  scene.environment = pmrem.fromScene(env, 0.04).texture;
}

scene.add(new THREE.AmbientLight(0x8899bb, 0.55));
const sun = new THREE.DirectionalLight(0xffffff, 2.0);
sun.position.set(6, 9, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
scene.add(sun);
const rim = new THREE.PointLight(0x3b82f6, 30, 26); rim.position.set(-5, 3, -4); scene.add(rim);
const fill = new THREE.PointLight(0xffd9a0, 12, 22); fill.position.set(5, 2, -5); scene.add(fill);

const grid = new THREE.GridHelper(24, 24, 0x1c3050, 0x101d33);
grid.position.y = 0.001;
scene.add(grid);
// 车底接触阴影盘
const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40),
  new THREE.ShadowMaterial({ opacity: 0.45 }));
shadowDisc.rotation.x = -Math.PI / 2; shadowDisc.position.y = 0.005;
shadowDisc.receiveShadow = true;
scene.add(shadowDisc);

/* ---------- 车身外壳（半透明）与车轮 ---------- */
const car = new THREE.Group();
scene.add(car);
const shellGroup = new THREE.Group();
car.add(shellGroup);

const shellCol = CFG.shell.color || 0x2f5d8a;
const bodyMat = new THREE.MeshStandardMaterial({
  color: shellCol, transparent: true, opacity: 0.16,
  roughness: 0.35, metalness: 0.55, depthWrite: false,
  side: THREE.DoubleSide
});
const glassMat = new THREE.MeshStandardMaterial({
  color: 0x9fc2ef, transparent: true, opacity: 0.22,
  roughness: 0.1, metalness: 0.4, depthWrite: false
});

function box(mat, p, s, g, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(s[0], s[1], s[2]), mat);
  m.position.set(p[0], p[1], p[2]);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  (g || car).add(m);
  return m;
}
function cyl(mat, p, r, h, axis = 'y') {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), mat);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  else if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.position.set(p[0], p[1], p[2]); m.castShadow = true; car.add(m);
  return m;
}

/* ---------- 车壳外观：下车身/引擎盖/尾箱盖/保险杠/灯组/格栅/后视镜/立柱/风挡 ---------- */
const isSUV = !!CFG.shell.suv;
box(bodyMat, [0, 0.62, 0], [4.35, 0.55, 1.76], shellGroup);            // 下车身
box(bodyMat, [-1.5, 0.94, 0], [1.15, 0.09, 1.55], shellGroup, 0, 0, -0.05); // 引擎盖（前斜）
box(bodyMat, [1.78, 0.92, 0], [0.85, 0.08, 1.5], shellGroup, 0, 0, 0.04);    // 尾箱盖
box(bodyMat, [-2.19, 0.5, 0], [0.28, 0.32, 1.82], shellGroup);         // 前保险杠
box(bodyMat, [2.19, 0.52, 0], [0.26, 0.3, 1.82], shellGroup);          // 后保险杠
// 乘员舱：平滑曲面玻璃罩（侧面轮廓曲线挤出，前后风挡一体过渡）
const cabinX = isSUV ? 0.15 : 0.2, cabinY = isSUV ? 1.13 : 1.08;
const cabinL = isSUV ? 2.75 : 2.35, cabinH = isSUV ? 0.62 : 0.5, cabinW = isSUV ? 1.66 : 1.58;
const cabProf = new THREE.Shape();
{
  const xF = cabinX - cabinL / 2 - (isSUV ? 0.3 : 0.34);   // 罩体前端（接引擎盖）
  const xR = cabinX + cabinL / 2 + (isSUV ? 0.26 : 0.3);   // 罩体后端（接尾箱盖）
  const yB = cabinY - cabinH / 2 + 0.02;                   // 罩体底沿（窗台线）
  const yT = cabinY + cabinH / 2 + 0.06;                   // 车顶线
  const xRoofF = cabinX - cabinL * 0.24, xRoofR = cabinX + cabinL * 0.26;
  cabProf.moveTo(xF, yB);
  cabProf.quadraticCurveTo(xF + 0.1, cabinY + cabinH * 0.62, xRoofF, yT);   // 前风挡弧线
  cabProf.lineTo(xRoofR, yT);                                                // 车顶
  cabProf.quadraticCurveTo(xR - 0.08, cabinY + cabinH * 0.6, xR, yB + 0.05); // 后风挡弧线
  cabProf.lineTo(xF, yB);                                                    // 底沿闭合
}
const cabGeo = new THREE.ExtrudeGeometry(cabProf, {
  depth: cabinW - 0.12, bevelEnabled: true,
  bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4, curveSegments: 24
});
const canopy = new THREE.Mesh(cabGeo, glassMat);
canopy.position.z = -(cabinW - 0.12) / 2;
canopy.castShadow = true;
shellGroup.add(canopy);
// A/B/C 柱
[-1, 1].forEach(sz => {
  box(bodyMat, [cabinX - cabinL / 2 + 0.06, cabinY, sz * (cabinW / 2 - 0.02)], [0.09, cabinH + 0.06, 0.08], shellGroup, 0, 0, 0.5);   // A柱
  box(bodyMat, [cabinX, cabinY, sz * (cabinW / 2 - 0.02)], [0.08, cabinH + 0.06, 0.08], shellGroup);                                  // B柱
  box(bodyMat, [cabinX + cabinL / 2 - 0.05, cabinY, sz * (cabinW / 2 - 0.02)], [0.09, cabinH + 0.06, 0.08], shellGroup, 0, 0, -0.45); // C柱
});
// 前大灯（近/远光灯组）+ 尾灯贯穿条
const headMat = new THREE.MeshStandardMaterial({ color: 0xeaf4ff, emissive: 0xbfd9ff, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.3 });
const tailMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xd9261c, emissiveIntensity: 1.1, roughness: 0.3 });
[-1, 1].forEach(sz => {
  box(headMat, [-2.28, 0.76, sz * 0.55], [0.08, 0.14, 0.46], shellGroup, 0, sz * 0.12, 0);   // 大灯
  box(tailMat, [2.28, 0.78, sz * 0.55], [0.07, 0.12, 0.48], shellGroup, 0, -sz * 0.1, 0);     // 尾灯
});
box(tailMat, [2.29, 0.8, 0], [0.05, 0.05, 1.1], shellGroup);                               // 贯穿尾灯
// 进气格栅（发动机/增程器散热需求）+ 下进气口
const grilleMat = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.8, metalness: 0.2 });
const slatMat = new THREE.MeshStandardMaterial({ color: 0x39424f, roughness: 0.5, metalness: 0.6 });
box(grilleMat, [-2.3, 0.58, 0], [0.06, 0.2, 0.95], shellGroup);
for (let i = 0; i < 3; i++) box(slatMat, [-2.33, 0.52 + i * 0.06, 0], [0.03, 0.025, 0.9], shellGroup);
box(grilleMat, [-2.3, 0.36, 0], [0.06, 0.12, 1.3], shellGroup);
// 外后视镜（镜托+镜壳）
const mirrorMat = new THREE.MeshStandardMaterial({ color: shellCol, roughness: 0.4, metalness: 0.4 });
[-1, 1].forEach(sz => {
  box(mirrorMat, [-0.68, 1.0, sz * 0.93], [0.08, 0.04, 0.14], shellGroup);                   // 镜托
  box(mirrorMat, [-0.68, 1.02, sz * 1.0], [0.16, 0.12, 0.07], shellGroup);                   // 镜壳
});

/* ---------- 车内内饰：座椅×5 / 方向盘 / 仪表台 / 中控 ---------- */
const cabinGroup = new THREE.Group();
car.add(cabinGroup);
// 车内顶灯：照亮内饰便于透视观察
const cabinLight = new THREE.PointLight(0xbfd4ff, 6, 3.2);
cabinLight.position.set(cabinX, cabinY + 0.25, 0);
cabinGroup.add(cabinLight);
const seatMat = new THREE.MeshStandardMaterial({ color: 0x35426b, roughness: 0.8, metalness: 0.05, transparent: true, opacity: 0.9, emissive: 0x101a30, emissiveIntensity: 0.6 });
const seatAccent = new THREE.MeshStandardMaterial({ color: 0x4a6aaa, roughness: 0.7, metalness: 0.1, transparent: true, opacity: 0.9, emissive: 0x122040, emissiveIntensity: 0.6 });
const dashMat = new THREE.MeshStandardMaterial({ color: 0x232c44, roughness: 0.75, metalness: 0.1, transparent: true, opacity: 0.9, emissive: 0x0d1428, emissiveIntensity: 0.6 });
const screenMat = new THREE.MeshStandardMaterial({ color: 0x0d1526, emissive: 0x1266f1, emissiveIntensity: 0.55, roughness: 0.3 });
function seat(g, x, z, withHead) {
  box(seatMat, [x, 0.62, z], [0.48, 0.16, 0.46], g, 0, 0, -0.06);       // 坐垫
  box(seatMat, [x + 0.24, 0.86, z], [0.14, 0.52, 0.46], g, 0, 0, 0.12); // 靠背
  box(seatAccent, [x + 0.18, 0.86, z], [0.04, 0.44, 0.4], g, 0, 0, 0.12); // 靠背饰面条
  if (withHead) box(seatMat, [x + 0.32, 1.16, z], [0.12, 0.14, 0.24], g, 0, 0, 0.1); // 头枕
}
seat(cabinGroup, -0.52, -0.4, true);   // 主驾
seat(cabinGroup, -0.52, 0.4, true);    // 副驾
box(seatMat, [0.78, 0.62, 0], [0.5, 0.16, 1.3], cabinGroup, 0, 0, -0.04);   // 后排坐垫通排
box(seatMat, [1.06, 0.86, 0], [0.14, 0.5, 1.3], cabinGroup, 0, 0, 0.1);     // 后排靠背
box(seatMat, [1.13, 1.14, -0.35], [0.12, 0.13, 0.22], cabinGroup, 0, 0, 0.1); // 后排头枕×2
box(seatMat, [1.13, 1.14, 0.35], [0.12, 0.13, 0.22], cabinGroup, 0, 0, 0.1);
box(dashMat, [-0.92, 0.92, 0], [0.34, 0.16, 1.5], cabinGroup);              // 仪表台
box(screenMat, [-0.8, 1.0, 0], [0.05, 0.12, 0.34], cabinGroup, 0, 0, 0.15); // 中控屏
box(screenMat, [-0.9, 1.0, -0.38], [0.04, 0.1, 0.2], cabinGroup);           // 仪表屏
// 方向盘：轮圈+辐条+转向柱
const swMat = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.7 });
const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 10, 26), swMat);
wheelRim.position.set(-0.68, 0.98, -0.4); wheelRim.rotation.y = Math.PI / 2 - 0.35;
cabinGroup.add(wheelRim);
box(swMat, [-0.72, 0.98, -0.4], [0.1, 0.03, 0.03], cabinGroup);
const col = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 14), dashMat);
col.rotation.z = Math.PI / 2; col.position.set(-0.84, 0.95, -0.4); cabinGroup.add(col); // 转向柱

// 轮拱示意
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.85, metalness: 0.1 });
const hubMat = new THREE.MeshStandardMaterial({ color: 0x9aa4b5, roughness: 0.3, metalness: 0.8 });
[[-1.45, 0.83], [-1.45, -0.83], [1.45, 0.83], [1.45, -0.83]].forEach(([x, z]) => {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 28), wheelMat);
  w.rotation.x = Math.PI / 2; w.position.set(x, 0.34, z); w.castShadow = true; car.add(w);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.26, 20), hubMat);
  hub.rotation.x = Math.PI / 2; hub.position.set(x, 0.34, z); car.add(hub);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 22),
    new THREE.MeshStandardMaterial({ color: 0x7a8496, metalness: 0.85, roughness: 0.3 }));
  disc.rotation.x = Math.PI / 2; disc.position.set(x, 0.34, z * 0.99); car.add(disc); // 刹车盘
});

/* ---------- 零部件 ---------- */
const parts = [];       // {group, cfg, anchor, labelEl, dotEl, mats}
const pickables = [];

CFG.parts.forEach((p, idx) => {
  const g = new THREE.Group();
  const mats = [];
  if (p.b && BUILDERS[p.b]) {
    // 精细组合件建模
    const built = BUILDERS[p.b](p.opt || {});
    g.add(built);
    const seen = new Set();
    built.traverse(o => {
      if (o.isMesh) {
        if (Array.isArray(o.material)) o.material.forEach(m => { if (!seen.has(m)) { seen.add(m); mats.push(m); } });
        else if (o.material && !seen.has(o.material)) { seen.add(o.material); mats.push(o.material); }
      }
    });
  } else {
  const mkMat = (c) => {
    const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.4 });
    mats.push(m); return m;
  };
  (p.boxes || []).forEach(b => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(b.s[0], b.s[1], b.s[2]), mkMat(b.c || p.color));
    m.position.set(b.p[0], b.p[1], b.p[2]);
    if (b.r) m.rotation.set(b.r[0] || 0, b.r[1] || 0, b.r[2] || 0);
    m.castShadow = true; g.add(m);
  });
  (p.cyl || []).forEach(c => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(c.r, c.r, c.h, 22), mkMat(c.c || p.color));
    if (c.axis === 'x') m.rotation.z = Math.PI / 2;
    else if (c.axis === 'z') m.rotation.x = Math.PI / 2;
    m.position.set(c.p[0], c.p[1], c.p[2]);
    m.castShadow = true; g.add(m);
  });
  }
  g.position.set(p.p ? p.p[0] : 0, p.p ? p.p[1] : 0, p.p ? p.p[2] : 0);
  if (p.rot) g.rotation.set(p.rot[0] || 0, p.rot[1] || 0, p.rot[2] || 0);
  // 标签锚点：部件包围盒顶部
  const bb = new THREE.Box3().setFromObject(g);
  const anchor = new THREE.Object3D();
  anchor.position.set((bb.min.x + bb.max.x) / 2, bb.max.y + 0.1, (bb.min.z + bb.max.z) / 2);
  g.add(anchor);
  g.userData = { part: p, idx, mats };
  g.traverse(o => { if (o.isMesh) { o.userData.partIdx = idx; pickables.push(o); } });
  car.add(g);
  parts.push({ group: g, cfg: p, anchor, mats });
});

/* ---------- 底部部件学习入口（按部件颜色，同纯电版式） ---------- */
const chipBar = document.getElementById('chipBar');
const mk = ((document.querySelector('script[src^="cfg-"]') || {}).src || '').match(/cfg-(\w+)/);
const MODEL_KEY = mk ? mk[1] : 'phev';
if (chipBar && !EMBED) {
  const bar = document.createElement('div');
  bar.className = 'chiprow';
  parts.forEach((pt, i) => {
    const b = document.createElement('button');
    b.className = 'pchip';
    const c = pt.cfg.color || '#3d7fe0';
    b.innerHTML = '<span class="d" style="background:' + c + ';box-shadow:0 0 8px ' + c + '"></span>' + pt.cfg.name.split('（')[0];
    b.onclick = () => { location.href = 'part.html?m=' + MODEL_KEY + '&p=' + i; };
    bar.appendChild(b);
  });
  chipBar.appendChild(bar);
} else if (chipBar) {
  chipBar.style.display = 'none';
}

/* ---------- 选中与信息卡 ---------- */
let selected = -1;
const card = document.getElementById('partCard');
function select(idx) {
  selected = idx;
  parts.forEach((pt, i) => {
    pt.mats.forEach(m => {
      m.emissive.setHex(i === idx ? 0x1c4fd6 : 0x000000);
      m.emissiveIntensity = i === idx ? 0.55 : 0;
    });
  });
  if (EMBED) { card.classList.remove('show'); return; } // 嵌入模式：不弹信息卡
  if (idx >= 0) {
    const p = parts[idx].cfg;
    document.getElementById('pcName').textContent = p.name;
    document.getElementById('pcDesc').textContent = p.desc;
    document.getElementById('pcDiff').textContent = p.diff || '';
    const mk = ((document.querySelector('script[src^="cfg-"]') || {}).src || '').match(/cfg-(\w+)/);
    document.getElementById('pcCourse').onclick = () => {
      location.href = 'part.html?m=' + (mk ? mk[1] : 'phev') + '&p=' + idx;
    };
    card.classList.add('show');
  } else {
    card.classList.remove('show');
  }
}

const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let downX = 0, downY = 0;
renderer.domElement.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; });
renderer.domElement.addEventListener('pointerup', e => {
  if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) return; // 拖拽不算点击
  const r = renderer.domElement.getBoundingClientRect();
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(pickables, false);
  if (hits.length) select(hits[0].object.userData.partIdx);
  else select(-1);
});

/* ---------- 视角与开关 ---------- */
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.55, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3.2;
controls.maxDistance = 13;
controls.maxPolarAngle = 1.52;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.1;
let idleTimer = null;
controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(idleTimer); });
controls.addEventListener('end', () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (rotOn) controls.autoRotate = true; }, 3000);
});

let rotOn = true, underMode = false;
function setView(mode) {
  underMode = (mode === 'under');
  shellGroup.visible = !underMode;
  cabinGroup.visible = !underMode;
  const f = frameFactor();
  if (underMode) {
    camera.position.copy(CAM_UNDER).multiplyScalar(f);
    controls.target.set(0, 0.32, 0);
    controls.maxPolarAngle = 1.6;
  } else {
    camera.position.copy(CAM_WHOLE).multiplyScalar(f);
    controls.target.set(0, 0.55, 0);
    controls.maxPolarAngle = 1.52;
  }
  document.getElementById('vWhole').classList.toggle('on', !underMode);
  document.getElementById('vUnder').classList.toggle('on', underMode);
}
document.getElementById('vWhole').onclick = () => setView('whole');
document.getElementById('vUnder').onclick = () => setView('under');
document.getElementById('tRot').onclick = function () {
  rotOn = !rotOn;
  controls.autoRotate = rotOn;
  this.classList.toggle('on', rotOn);
  this.textContent = rotOn ? '旋转：开' : '旋转：关';
};
document.getElementById('pcClose').onclick = () => select(-1);

/* ---------- 标题信息 ---------- */
document.getElementById('typeTitle').textContent = CFG.title;
document.getElementById('typeTag').textContent = CFG.tag;
document.getElementById('typeSummary').textContent = CFG.summary;

/* ---------- 主循环 ---------- */
window.addEventListener('resize', () => {
  camera.aspect = W() / H();
  camera.updateProjectionMatrix();
  renderer.setSize(W(), H());
  controls.maxDistance = 13 * frameFactor();
  setView(underMode ? 'under' : 'whole');
});
function loop() {
  requestAnimationFrame(loop);
  controls.update();
  renderer.render(scene, camera);
}
loop();
// 默认：整车视角按钮点亮
setView('whole');
