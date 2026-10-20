// ============ 精细零部件建模库 ============
// 每个 builder 返回一个 THREE.Group（多组件组合件），调用时创建独立材质实例，支持单件高亮。
import * as THREE from 'three';

const M = (color, o = {}) => new THREE.MeshStandardMaterial({
  color, roughness: o.rough ?? 0.45, metalness: o.metal ?? 0.55,
  emissive: o.emissive || 0x000000, emissiveIntensity: o.ei || 0,
  transparent: !!o.alpha, opacity: o.alpha ?? 1
});

function bx(g, mat, p, s, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(s[0], s[1], s[2]), mat);
  m.position.set(p[0], p[1], p[2]); m.rotation.set(rx, ry, rz);
  m.castShadow = true; g.add(m); return m;
}
function cy(g, mat, p, r, h, axis = 'y', r2) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r2 ?? r, h, 24), mat);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  else if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.position.set(p[0], p[1], p[2]); m.castShadow = true; g.add(m); return m;
}
function sp(g, mat, p, r, scale = [1, 1, 1]) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
  m.position.set(p[0], p[1], p[2]); m.scale.set(scale[0], scale[1], scale[2]);
  m.castShadow = true; g.add(m); return m;
}
function tor(g, mat, p, r, t, axis = 'z') {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 12, 28), mat);
  if (axis === 'x') m.rotation.y = Math.PI / 2;
  else if (axis === 'y') m.rotation.x = Math.PI / 2;
  m.position.set(p[0], p[1], p[2]); g.add(m); return m;
}

/* ---------- 通用件 ---------- */

// 驱动电机：定子+转子+端盖+接线盒+冷却套
export function motor(opt = {}) {
  const g = new THREE.Group();
  const stator = M(0x3d5a80), rotor = M(0xc9a86a, { metal: 0.85, rough: 0.3 }),
    endCap = M(0x8a93a6), box = M(0x2b3446), cool = M(0x66d9e8, { alpha: 0.5, emissive: 0x1c6f80, ei: 0.5 });
  const r = opt.r || 0.17, len = opt.len || 0.34;
  cy(g, stator, [0, 0, 0], r, len, 'z');                    // 定子壳
  cy(g, rotor, [0, 0, 0], r * 0.55, len * 1.15, 'z');       // 转子轴
  cy(g, endCap, [0, 0, len / 2], r * 0.92, 0.04, 'z');      // 前端盖
  cy(g, endCap, [0, 0, -len / 2], r * 0.92, 0.04, 'z');     // 后端盖
  bx(g, box, [0, r + 0.03, 0], [0.14, 0.08, 0.16]);         // 接线盒
  tor(g, cool, [0, 0, len * 0.2], r + 0.015, 0.012);        // 冷却环
  tor(g, cool, [0, 0, -len * 0.2], r + 0.015, 0.012);
  return g;
}

// 电机控制器：壳体+散热鳍片+母线电容+连接器
export function inverter() {
  const g = new THREE.Group();
  const shell = M(0x46618c), fin = M(0x2b3446), cap = M(0x2fd6a8, { emissive: 0x0a5c50, ei: 0.6 }),
    conn = M(0xff9f43), cu = M(0xc9a86a, { metal: 0.9, rough: 0.25 });
  bx(g, shell, [0, 0, 0], [0.38, 0.16, 0.3]);
  for (let i = 0; i < 4; i++) bx(g, fin, [0, -0.085, -0.12 + i * 0.08], [0.34, 0.03, 0.02]); // 散热鳍片
  cy(g, cap, [0.12, 0.1, 0], 0.035, 0.12);                  // 母线电容
  cy(g, cu, [-0.12, 0.1, 0.06], 0.028, 0.1);
  bx(g, conn, [0.2, 0.02, 0], [0.06, 0.08, 0.2]);           // 高压连接器
  bx(g, conn, [-0.2, 0.02, 0], [0.06, 0.08, 0.14]);
  return g;
}

// 车载充电机 OBC
export function obc() {
  const g = new THREE.Group();
  const shell = M(0x5b6b8c), fin = M(0x2b3446), conn = M(0xffd166), coil = M(0xc9a86a, { metal: 0.85, rough: 0.3 });
  bx(g, shell, [0, 0, 0], [0.32, 0.2, 0.26]);
  for (let i = 0; i < 3; i++) bx(g, fin, [0, -0.11, -0.08 + i * 0.08], [0.28, 0.025, 0.02]);
  cy(g, coil, [0.08, 0.13, 0], 0.045, 0.09);                 // 变压器磁芯
  bx(g, conn, [-0.17, 0.02, 0], [0.05, 0.09, 0.16]);        // 交流进线座
  bx(g, conn, [0.17, 0.02, 0], [0.05, 0.09, 0.16]);         // 直流出线座
  return g;
}

// DC-DC 转换器
export function dcdc() {
  const g = new THREE.Group();
  const shell = M(0x3f7f74), conn = M(0xffd166), core = M(0xc9a86a, { metal: 0.85, rough: 0.3 });
  bx(g, shell, [0, 0, 0], [0.24, 0.16, 0.22]);
  tor(g, core, [0, 0.11, 0], 0.05, 0.018, 'y');             // 环形电感
  bx(g, conn, [0.13, 0.02, 0], [0.04, 0.07, 0.12]);
  bx(g, conn, [-0.13, 0.02, 0], [0.04, 0.07, 0.12]);
  return g;
}

// 高压配电盒 PDU
export function pdu() {
  const g = new THREE.Group();
  const shell = M(0x8a6a3c), fuse = M(0xff6b6b), bar = M(0xc9a86a, { metal: 0.9, rough: 0.25 }), lid = M(0x5c4626);
  bx(g, shell, [0, 0, 0], [0.3, 0.18, 0.24]);
  bx(g, lid, [0, 0.1, 0], [0.26, 0.03, 0.2]);
  for (let i = 0; i < 3; i++) cy(g, fuse, [-0.08 + i * 0.08, 0.13, 0.05], 0.018, 0.07); // 熔断器
  bx(g, bar, [0, 0.13, -0.05], [0.22, 0.02, 0.03]);         // 铜排
  return g;
}

// PTC 加热器
export function ptc() {
  const g = new THREE.Group();
  const shell = M(0xa8503c), pipe = M(0x9aa4b5), glow = M(0xff8c5a, { emissive: 0xd94f04, ei: 0.9 });
  bx(g, shell, [0, 0, 0], [0.2, 0.13, 0.18]);
  cy(g, glow, [0, 0, 0], 0.045, 0.15, 'x');                 // PTC 芯
  cy(g, pipe, [0, 0.02, 0.11], 0.025, 0.06, 'z');           // 进出水口
  cy(g, pipe, [0, 0.02, -0.11], 0.025, 0.06, 'z');
  bx(g, M(0x2b3446), [0.11, 0, 0], [0.04, 0.08, 0.12]);     // 接插件
  return g;
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
  return g;
}

// 整车控制器 VCU
export function vcu() {
  const g = new THREE.Group();
  const shell = M(0x4c3f8a), conn = M(0x2b3446), led = M(0x2fd6a8, { emissive: 0x0fbf9f, ei: 1.2 });
  bx(g, shell, [0, 0, 0], [0.24, 0.05, 0.2]);
  for (let i = 0; i < 3; i++) bx(g, conn, [-0.08 + i * 0.08, -0.02, 0.11], [0.05, 0.035, 0.04]); // 接插件排
  cy(g, led, [0.09, 0.03, -0.06], 0.01, 0.015);
  return g;
}

// 充电口/加氢口总成
export function port(opt = {}) {
  const g = new THREE.Group();
  const body = M(opt.color || 0xffd166), socket = M(0x14181f, { rough: 0.8 }), flap = M(0x3d5a80, { metal: 0.3 });
  bx(g, body, [0, 0, 0], [0.26, 0.18, 0.08]);
  cy(g, socket, [0, 0, 0.045], 0.055, 0.03, 'z');           // 插座/加氢嘴
  bx(g, flap, [0, 0.11, -0.02], [0.24, 0.02, 0.1], -0.5);   // 翻盖
  return g;
}

// 动力电池包：托盘+模组×N+BMS+维修开关+冷却进出口
export function battery(opt = {}) {
  const g = new THREE.Group();
  const len = opt.len || 1.7, n = opt.modules || 5;
  const tray = M(0x2b3446), mod = M(0x2f6fed, { metal: 0.3, rough: 0.4 }),
    bms = M(0xb08cff), sw = M(0xff6b6b), cool = M(0x66d9e8, { emissive: 0x1c6f80, ei: 0.7 });
  bx(g, tray, [0, 0, 0], [len, 0.1, 1.0]);                  // 下托盘
  bx(g, tray, [0, 0.14, 0], [len * 0.98, 0.04, 0.96]);      // 上盖
  const mw = (len - 0.3) / n;
  for (let i = 0; i < n; i++)                               // 电芯模组
    bx(g, mod, [-len / 2 + 0.2 + mw * (i + 0.5), 0.07, 0], [mw * 0.88, 0.1, 0.8]);
  bx(g, bms, [len / 2 - 0.12, 0.07, -0.3], [0.2, 0.08, 0.25]); // BMS
  bx(g, sw, [-len / 2 + 0.1, 0.07, 0.32], [0.1, 0.08, 0.12]);  // 维修开关
  cy(g, cool, [-len / 2 - 0.04, 0.02, 0.3], 0.022, 0.1, 'x');  // 冷却管
  cy(g, cool, [len / 2 + 0.04, 0.02, 0.3], 0.022, 0.1, 'x');
  return g;
}

// 油箱：桶体+固定带+加油管
export function fuelTank(opt = {}) {
  const g = new THREE.Group();
  const L = opt.len || 0.62, Wd = opt.w || 0.9;
  const body = M(0xb8a03c, { metal: 0.3, rough: 0.55 }), strap = M(0x2b3446), pipe = M(0x9aa4b5);
  bx(g, body, [0, 0, 0], [L, 0.26, Wd]);
  sp(g, body, [L / 2, 0, 0], Wd / 2, [0.4, 0.26 / (Wd / 2), 1]);
  sp(g, body, [-L / 2, 0, 0], Wd / 2, [0.4, 0.26 / (Wd / 2), 1]);
  bx(g, strap, [L * 0.25, 0, 0], [0.04, 0.29, Wd * 1.02]); // 固定带
  bx(g, strap, [-L * 0.25, 0, 0], [0.04, 0.29, Wd * 1.02]);
  cy(g, pipe, [0, 0.16, Wd / 2 + 0.06], 0.025, 0.16, 'z'); // 加油管
  return g;
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
  return g;
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
  return g;
}

// DHT 混动专用变速箱：壳体+离合器鼓+齿轮组+内置电机+减速器
export function dht() {
  const g = new THREE.Group();
  const housing = M(0x5a6478), drum = M(0x7a8496, { metal: 0.7, rough: 0.35 }),
    gear = M(0xc9a86a, { metal: 0.9, rough: 0.25 }), stator = M(0x3d5a80),
    dark = M(0x232a36), cool = M(0x66d9e8, { emissive: 0x1c6f80, ei: 0.6 });
  cy(g, housing, [0, 0, 0], 0.19, 0.34, 'x');               // 主壳体
  cy(g, drum, [-0.1, 0, 0], 0.145, 0.12, 'x');              // 离合器鼓
  for (let i = 0; i < 3; i++)                                 // 行星齿轮组
    cy(g, gear, [0.02 + i * 0.07, 0, 0], 0.1 - i * 0.022, 0.035, 'x');
  cy(g, stator, [0.14, 0, 0], 0.165, 0.1, 'x');             // 内置驱动电机定子
  cy(g, dark, [0.14, 0, 0], 0.12, 0.12, 'x');               // 转子腔
  cy(g, drum, [0.22, 0, 0], 0.08, 0.06, 'x');               // 减速器输出
  tor(g, cool, [0, 0, 0], 0.2, 0.012, 'x');                 // 冷却水道
  return g;
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
  return g;
}

/* ---------- 氢燃料专用 ---------- */

// 燃料电池堆：端板+双极板组+集流板+拉杆
export function fuelStack() {
  const g = new THREE.Group();
  const plate = M(0x2fd6a8, { metal: 0.4, rough: 0.35 }), cell = M(0x9aa4b5, { metal: 0.8, rough: 0.3 }),
    collector = M(0xc9a86a, { metal: 0.9, rough: 0.2 }), rod = M(0x2b3446),
    h2 = M(0x66d9e8, { emissive: 0x1c6f80, ei: 0.7 }), o2 = M(0xff8c5a, { emissive: 0xd94f04, ei: 0.6 });
  const n = 6, gap = 0.035;
  bx(g, collector, [-n * gap / 2 - 0.04, 0, 0], [0.05, 0.3, 0.52]); // 负极集流板
  bx(g, collector, [n * gap / 2 + 0.04, 0, 0], [0.05, 0.3, 0.52]);  // 正极集流板
  bx(g, plate, [-n * gap / 2 - 0.09, 0, 0], [0.05, 0.34, 0.56]);    // 端板×2
  bx(g, plate, [n * gap / 2 + 0.09, 0, 0], [0.05, 0.34, 0.56]);
  for (let i = 0; i < n; i++)                                  // 双极板+膜电极组
    bx(g, cell, [-((n - 1) / 2) * gap + i * gap, 0, 0], [0.028, 0.28, 0.48]);
  [[0.16, 0.24], [0.16, -0.24], [-0.16, 0.24], [-0.16, -0.24]].forEach(([y, z]) =>
    cy(g, rod, [0, y, z], 0.012, n * gap + 0.24, 'x'));        // 长拉杆
  cy(g, h2, [0, 0.12, 0.3], 0.028, 0.1, 'z');                  // 氢气进口
  cy(g, o2, [0, -0.12, 0.3], 0.028, 0.1, 'z');                 // 空气进口
  return g;
}

// 储氢罐组：罐体×N（胶囊体+封头+瓶阀+固定箍）
export function h2tanks(opt = {}) {
  const g = new THREE.Group();
  const n = opt.n || 3, r = opt.r || 0.17, len = opt.len || 0.95, gap = opt.gap || 0.42;
  const body = M(0xd7e0ec, { metal: 0.6, rough: 0.3, alpha: 0.95 }),
    wrap = M(0x2fd6a8, { metal: 0.4, rough: 0.4 }), valve = M(0xff6b6b), strap = M(0x2b3446);
  for (let i = 0; i < n; i++) {
    const z = -((n - 1) / 2) * gap + i * gap;
    const cap = new THREE.Mesh(new THREE.CapsuleGeometry(r, len - 2 * r, 6, 18), body);
    cap.rotation.z = Math.PI / 2; cap.position.set(0, 0, z); cap.castShadow = true; g.add(cap);
    tor(g, wrap, [-len * 0.18, 0, z], r + 0.008, 0.014, 'x');  // 碳纤维缠绕环带
    tor(g, wrap, [len * 0.18, 0, z], r + 0.008, 0.014, 'x');
    cy(g, valve, [len / 2 + 0.02, 0.1, z], 0.028, 0.08);       // 瓶阀
    bx(g, strap, [0, -r + 0.01, z], [0.3, 0.04, 0.06]);        // 固定箍
  }
  cy(g, M(0x66d9e8, { emissive: 0x1c6f80, ei: 0.7 }), [len / 2 + 0.02, 0.1, 0], 0.02, gap * (n - 1) + 0.1, 'z'); // 汇流管
  return g;
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
  return g;
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
  return g;
}

/* ---------- 注册表 ---------- */
export const BUILDERS = {
  motor, inverter, obc, dcdc, pdu, ptc, compressor, vcu, port,
  battery, fuelTank, exhaust, phevEngine, dht, rex,
  fuelStack, h2tanks, airComp, h2line
};
