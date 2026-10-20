// Architecture-specific teaching assemblies. Dimensions are normalized to the
// shared 2.90 m wheelbase; these are not OEM CAD or service clearances.
// Local axes: front -X, up +Y, transverse Z. Profile p/rot/scale are applied outside.
import * as THREE from 'three';
import { BUILDERS } from './detail.js';
import { roundedBox, finishPalette, fastener, connector, cable } from './model-quality.js';

function box(parent, material, p, size) {
  const mesh = new THREE.Mesh(roundedBox(...size), material);
  mesh.position.fromArray(p); mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData.manufacturingDetail = true; parent.add(mesh); return mesh;
}
function cylinder(parent, material, p, radius, length, axis = 'x') {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 40), material);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.position.fromArray(p); mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData.manufacturingDetail = true; parent.add(mesh); return mesh;
}
function positive(value, fallback, name) {
  const n = value ?? fallback;
  if (!Number.isFinite(n) || n <= 0) throw new TypeError('Invalid profile dimension: ' + name);
  return n;
}

// Volvo SPA T8: the battery follows the central tunnel, leaving the footwells
// clear. Build its narrow case directly so connectors and modules keep their
// proportions rather than flattening a full-width BEV pack.
export function tunnelBattery(opt = {}) {
  const g = new THREE.Group(), f = finishPalette();
  const len = positive(opt.len, 1.72, 'len'), width = positive(opt.width, .31, 'width');
  const height = positive(opt.height, .26, 'height'), count = opt.modules ?? 8;
  if (!Number.isInteger(count) || count < 2 || count > 20) throw new TypeError('Invalid tunnel battery module count');
  g.name = 'central_tunnel_battery';
  g.userData.profileGeometry = 'tunnelBattery';
  g.userData.profileRoles = [{ role: 'traction-battery', axis: [1, 0, 0], form: 'central-tunnel' }];
  box(g, f.aluminum, [0, -height * .43, 0], [len, height * .14, width]);
  for (const z of [-1, 1]) box(g, f.aluminum, [0, 0, z * width * .47], [len, height, width * .06]);
  for (const x of [-1, 1]) box(g, f.aluminum, [x * len * .485, 0, 0], [len * .03, height, width]);
  const cell = new THREE.MeshStandardMaterial({ color: 0x697e8a, metalness: .42, roughness: .5 });
  const step = (len - .12) / count;
  for (let i = 0; i < count; i++) {
    const x = -len / 2 + .06 + step * (i + .5);
    box(g, cell, [x, 0, 0], [step * .9, height * .66, width * .72]);
    box(g, f.copper, [x, height * .35, 0], [step * .64, .008, width * .2]);
  }
  // Partial cover keeps the lesson cutaway legible without losing its tunnel form.
  box(g, f.aluminum, [0, height * .45, -width * .32], [len * .96, height * .1, width * .3]);
  for (const z of [-1, 1]) {
    cylinder(g, f.steel, [0, -height * .23, z * width * .35], .012, len * .92);
    for (const x of [-len * .4, 0, len * .4]) fastener(g, x, height * .5, z * width * .46, .008, f.steel);
  }
  connector(g, [-len / 2 - .028, height * .12, 0], .025, .056, f.orange, 'x');
  cable(g, [[-len * .43, height * .34, width * .25], [0, height * .36, width * .28], [len * .4, height * .34, width * .25]], .006, f.orange);
  return g;
}

function tankSet(kind, specifications) {
  if (!Array.isArray(specifications) || specifications.length !== 3) throw new RangeError('Vehicle tank set requires exactly three vessels');
  const g = new THREE.Group(); g.name = kind; g.userData.profileGeometry = kind;
  g.userData.profileRoles = [];
  const ids = new Set();
  for (const [index, spec] of specifications.entries()) {
    if (!spec.id || ids.has(spec.id)) throw new TypeError('Tank vessel names must be unique');
    ids.add(spec.id);
    const len = positive(spec.len, undefined, spec.id + '.len'), r = positive(spec.r, undefined, spec.id + '.r');
    if (len <= r * 2) throw new RangeError('Tank length must include two hemispherical caps');
    const expectedAxis = kind === 'miraiTankSet' && index === 0 ? 'x' : 'z';
    if (spec.axis !== expectedAxis || !Array.isArray(spec.p) || spec.p.length !== 3 || !spec.p.every(Number.isFinite)) throw new TypeError('Invalid tank orientation or center');
    // Reuse the detailed pressure-vessel, valve, restraint and fitting builder.
    // Its single tank is X-aligned; a Y rotation maps that axis onto vehicle Z.
    const tank = BUILDERS.h2tanks({ n: 1, len, r });
    tank.name = spec.id; tank.position.fromArray(spec.p);
    if (spec.axis === 'z') tank.rotation.y = Math.PI / 2;
    tank.userData.profileRole = 'hydrogen-storage';
    tank.userData.tankAxis = spec.axis === 'x' ? [1, 0, 0] : [0, 0, -1];
    g.add(tank);
    g.userData.profileRoles.push({ role: 'hydrogen-storage', node: spec.id, axis: tank.userData.tankAxis, center: [...spec.p], len, radius: r });
  }
  return g;
}

// Second-generation Mirai: a long central longitudinal tank plus two transverse
// rear tanks. Individual sizes differ; never rotate a parallel three-tank rack.
export function miraiTankSet(opt = {}) {
  return tankSet('miraiTankSet', opt.tanks ?? [
    { id: 'central_longitudinal_tank', axis: 'x', p: [-.4, 0, 0], len: 1.65, r: .145 },
    { id: 'rear_transverse_tank', axis: 'z', p: [.71, 0, 0], len: 1.2, r: .145 },
    { id: 'rear_small_transverse_tank', axis: 'z', p: [1.12, 0, 0], len: .86, r: .12 }
  ]);
}

// First-generation NEXO (2018): three transverse vessels in the rear floor.
export function nexoTankSet(opt = {}) {
  return tankSet('nexoTankSet', opt.tanks ?? [-.43, 0, .43].map((x, i) => ({
    id: 'rear_transverse_tank_' + (i + 1), axis: 'z', p: [x, 0, 0], len: 1.18, r: .15
  })));
}

// Volvo's front mechanical path uses an automatic transaxle, not the generic
// two-motor DHT cutaway. Shaft axis is local X, like the adjacent ICE builder.
export function transverseAutomatic() {
  const g = new THREE.Group(), f = finishPalette();
  g.name = 'transverse_automatic_transaxle'; g.userData.profileGeometry = 'transverseAutomatic';
  g.userData.profileRoles = [{ role: 'mechanical-transmission', axis: [1, 0, 0], form: 'automatic-transaxle' }];
  cylinder(g, f.aluminum, [-.12, .025, 0], .205, .15);
  cylinder(g, f.aluminum, [.065, .025, 0], .17, .25);
  box(g, f.aluminum, [0, -.155, 0], [.39, .11, .29]);
  cylinder(g, f.aluminum, [.13, -.11, 0], .11, .25);
  for (const x of [-.21, .27]) cylinder(g, f.steel, [x, -.11, 0], .045, .1);
  for (let i = 0; i < 7; i++) box(g, f.steel, [-.07 + i * .037, -.168, 0], [.009, .035, .27]);
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5;
    fastener(g, -.2, .025 + Math.cos(a) * .178, Math.sin(a) * .178, .009, f.steel, 'x');
  }
  connector(g, [.07, .198, -.065], .018, .045, f.rubber);
  return g;
}

export const PROFILE_BUILDERS = { tunnelBattery, miraiTankSet, nexoTankSet, transverseAutomatic };
export function buildProfileGeometry(kind, opt = {}) {
  const builder = PROFILE_BUILDERS[kind];
  if (!builder) throw new TypeError('Unknown vehicle profile geometry: ' + kind);
  return builder(opt);
}
