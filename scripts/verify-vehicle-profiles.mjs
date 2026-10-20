import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url), threeURL = new URL('videos/three.module.js', root).href;
const THREE = await import(threeURL), source = path => readFile(new URL(path, root), 'utf8');
const dataURL = text => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const qualityURL = dataURL((await source('models/model-quality.js')).replace("from 'three'", `from '${threeURL}'`));
const detailURL = dataURL((await source('models/detail.js')).replace("from 'three'", `from '${threeURL}'`).replace("from './model-quality.js'", `from '${qualityURL}'`));
const geometryURL = dataURL((await source('models/vehicle-profile-geometry.js')).replace("from 'three'", `from '${threeURL}'`).replace("from './model-quality.js'", `from '${qualityURL}'`).replace("from './detail.js'", `from '${detailURL}'`));
const { BUILDERS } = await import(detailURL), { PROFILE_BUILDERS, buildProfileGeometry } = await import(geometryURL);
const componentURL = dataURL((await source('models/vehicle-component-geometry.js')).replace("from 'three'", `from '${threeURL}'`).replace("from './model-quality.js'", `from '${qualityURL}'`).replace("from './vehicle-profile-geometry.js'", `from '${geometryURL}'`));
const { VEHICLE_COMPONENT_BUILDERS } = await import(componentURL);
const ALL_PROFILE_BUILDERS = { ...PROFILE_BUILDERS, ...VEHICLE_COMPONENT_BUILDERS };
const utilsURL = dataURL((await source('vendor/three/addons/utils/BufferGeometryUtils.js')).replace("from 'three'", `from '${threeURL}'`));
const batchURL = dataURL((await source('models/static-assembly.js')).replace("from 'three'", `from '${threeURL}'`).replace("from 'three/addons/utils/BufferGeometryUtils.js'", `from '${utilsURL}'`));
const { batchStaticAssembly } = await import(batchURL);
const { disposeAssembly } = await import(qualityURL);
assert(!(await source('models/vehicle-component-geometry.js')).includes("from './detail.js'"), 'vehicle components do not reuse generic complete assemblies');
const round = n => Math.round(n * 10000) / 10000, vector = v => v.toArray().map(round);
const axis = (group, v) => vector(new THREE.Vector3(...v).applyQuaternion(group.getWorldQuaternion(new THREE.Quaternion())));
const bounds = g => new THREE.Box3().setFromObject(g);
const boxData = b => ({ min: vector(b.min), max: vector(b.max), center: vector(b.getCenter(new THREE.Vector3())), size: vector(b.getSize(new THREE.Vector3())) });
function geometryStats(group, label) {
  let meshes = 0, triangles = 0;
  group.traverse(o => {
    if (!o.isMesh) return;
    meshes++; triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
    for (const [name, attribute] of Object.entries(o.geometry.attributes)) for (const value of attribute.array) assert(Number.isFinite(value), label + ': finite ' + name);
  });
  assert(meshes > 0, label + ': has surfaces');
  const box = bounds(group);
  assert([...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite), label + ': finite world bounds');
  assert(box.getSize(new THREE.Vector3()).toArray().every(v => v > 0), label + ': nonzero bounds');
  return { meshes, triangles: Math.round(triangles) };
}

const report = { scope: 'Primary-source-supported architecture and vehicle-specific structure reconstructions, normalized teaching geometry; internal counts are samples, not OEM CAD or exact service clearances', frame: { front: '-X', up: '+Y', lateral: 'Z', wheelbase: 2.9, groundShiftY: -.095 }, geometry: {}, profiles: {}, violations: [] };
const componentSignatures = new Map();
function signature(group) {
  group.updateMatrixWorld(true); const points = [], p = new THREE.Vector3();
  group.traverse(o => { if (!o.isMesh) return; const attribute = o.geometry.attributes.position; for (let i = 0; i < attribute.count; i++) { p.fromBufferAttribute(attribute, i).applyMatrix4(o.matrixWorld); points.push(p.toArray().map(n => Math.round(n * 100000)).join(',')); } });
  return createHash('sha256').update([...new Set(points)].sort().join(';')).digest('hex');
}
for (const [name] of Object.entries(PROFILE_BUILDERS)) {
  const group = buildProfileGeometry(name);
  report.geometry[name] = { ...geometryStats(group, name), ...boxData(bounds(group)), roles: group.userData.profileRoles };
  if (name === 'tunnelBattery') {
    const size = bounds(group).getSize(new THREE.Vector3());
    assert(size.x / size.z > 4, 'T8 pack follows narrow central tunnel');
    const before = BUILDERS.battery({ len: 1.72, modules: 8 });
    report.geometry[name].before = boxData(bounds(before)); disposeAssembly(before);
  }
  if (name.endsWith('TankSet')) {
    assert.equal(group.children.length, 3, name + ': three separate pressure vessels');
    const tankAxes = group.children.map(t => axis(t, [1, 0, 0]));
    if (name === 'miraiTankSet') {
      assert(Math.abs(tankAxes[0][0]) > .999 && tankAxes.slice(1).every(a => Math.abs(a[2]) > .999), 'Mirai: one longitudinal and two transverse tanks');
      const lengths = group.userData.profileRoles.map(r => r.len);
      assert(lengths[0] > lengths[1] && lengths[1] > lengths[2], 'Mirai: differently sized tanks');
    } else assert(tankAxes.every(a => Math.abs(a[2]) > .999), 'NEXO: three transverse tanks');
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert(bounds(group.children[i]).intersect(bounds(group.children[j])).isEmpty(), name + ': separate tank restraints and fittings');
    report.geometry[name].tankAxes = tankAxes;
  }
  disposeAssembly(group);
}
assert.throws(() => buildProfileGeometry('unknown'), TypeError);
assert.throws(() => buildProfileGeometry('tunnelBattery', { width: NaN }), TypeError);
assert.throws(() => buildProfileGeometry('miraiTankSet', { tanks: [{ id: 'bad', axis: 'x', p: [0, 0, 0], len: .1, r: .2 }] }), RangeError);
assert.throws(() => buildProfileGeometry('nexoTankSet', { tanks: [{ id: 'bad1', axis: 'x', p: [0, 0, 0], len: 1, r: .1 }, { id: 'bad2' }, { id: 'bad3' }] }), TypeError);

if (!process.argv.includes('--geometry-only')) {
  const { VEHICLE_PROFILES } = await import(dataURL(await source('models/vehicle-profiles.js')));
  const profiles = Array.isArray(VEHICLE_PROFILES) ? VEHICLE_PROFILES : Object.values(VEHICLE_PROFILES);
  const expected = ['su7-rwd-2024', 'atto3-fwd-2023', 'model3-rwd-2023', 'xc60-t8-er-2022', 'li-l7-2023', 'mirai-gen2-2021', 'nexo-2018'];
  assert.deepEqual(profiles.map(p => p.id).sort(), expected.sort(), 'seven explicitly researched representative vehicles');
  for (const profile of profiles) {
    const frame = profile.coordinateFrame;
    assert(frame?.front === '-X' && frame.up === '+Y' && frame.lateral === 'Z' && frame.wheelbase === 2.9 && frame.groundShiftY === -.095, profile.id + ': agreed coordinate frame');
    assert(Array.isArray(profile.parts) && profile.parts.length > 0, profile.id + ': independent complete part array');
    const sourceIDs = new Set((profile.sources || []).map(s => s.id));
    assert(sourceIDs.size === profile.sources?.length && sourceIDs.size > 0, profile.id + ': unique source IDs');
    const vehicle = new THREE.Group(); vehicle.position.y = frame.groundShiftY;
    const parts = [], physical = [], motors = [], ids = new Set();
    const violation = (part, reason, detail) => report.violations.push({ profile: profile.id, part, reason, detail });
    for (const p of profile.parts) {
      assert(p.id && !ids.has(p.id), profile.id + ': unique visible part IDs'); ids.add(p.id);
      assert(p.evidence?.length && ['confirmed', 'schematic'].includes(p.confidence), profile.id + '/' + p.id + ': evidence and confidence');
      for (const evidenceID of p.evidence) assert(sourceIDs.has(evidenceID), profile.id + '/' + p.id + ': evidence exists in this profile sources: ' + evidenceID);
      assert(p.p?.length === 3 && p.p.every(Number.isFinite), profile.id + '/' + p.id + ': finite location');
      if (p.rot) assert(p.rot.length === 3 && p.rot.every(Number.isFinite));
      if (p.scale) assert(p.scale.length === 3 && p.scale.every(v => Number.isFinite(v) && v > 0));
      assert(Object.hasOwn(VEHICLE_COMPONENT_BUILDERS, p.geometry), profile.id + '/' + p.id + ': vehicle-specific component geometry');
      const builder = p.geometry ? ALL_PROFILE_BUILDERS[p.geometry] : BUILDERS[p.b];
      assert(builder, profile.id + '/' + p.id + ': registered geometry');
      const g = builder(p.opt || {}); g.name = p.id;
      assert(g.userData.vehicleComponent?.features && g.userData.vehicleComponent.scope.includes('非原厂 CAD'), profile.id + '/' + p.id + ': reconstruction scope and actual feature metadata');
      const componentSignature = signature(g);
      assert(!componentSignatures.has(componentSignature), profile.id + '/' + p.id + ': geometry duplicates ' + componentSignatures.get(componentSignature));
      componentSignatures.set(componentSignature, profile.id + '/' + p.id);
      const generic = BUILDERS[p.b](p.opt || {});
      assert.notEqual(componentSignature, signature(generic), profile.id + '/' + p.id + ': vehicle geometry differs from the generic complete assembly');
      disposeAssembly(generic);
      if (p.geometry === 'su7BladePack' || p.geometry === 'atto3BladePack') {
        const cells = []; g.traverse(o => { if (o.name.startsWith('sample_blade_cell_')) cells.push(o); });
        assert(cells.length >= 20 && cells.every(c => c.geometry.parameters.depth / c.geometry.parameters.width > 12), p.geometry + ': real long thin blade cells');
      }
      if (p.geometry === 'model3BatteryCase') {
        assert(g.getObjectByName('sealed_Model3_HV_battery_case') && g.getObjectByName('rear_penthouse_and_HV_header'), 'Model 3: documented closed case/header form');
        g.traverse(o => assert(!/4680|squirrel_cage|sample_.*cell/i.test(o.name), 'Model 3: no unverified battery cell or induction-rotor substitution'));
      }
      if (p.b === 'motor') assert(g.userData.rotorType === 'permanent-magnet-synchronous', p.geometry + ': corresponding PM motor family');
      // The production runtime batches first, then applies the installation
      // transform. Indexed geometry expands into repeated vertices, so compare
      // triangle count and precise bounds rather than representation-dependent hashes.
      const batched = batchStaticAssembly(builder(p.opt || {}));
      assert.deepEqual(batched.userData.vehicleComponent, g.userData.vehicleComponent, p.geometry + ': batching preserves vehicle-specific metadata');
      assert.equal(geometryStats(batched, p.geometry).triangles, geometryStats(g, p.geometry).triangles, p.geometry + ': batching preserves triangle count');
      const rawBounds = new THREE.Box3().setFromObject(g, true), batchBounds = new THREE.Box3().setFromObject(batched, true);
      assert(rawBounds.min.distanceTo(batchBounds.min) < 1e-6 && rawBounds.max.distanceTo(batchBounds.max) < 1e-6, p.geometry + ': batching preserves precise local bounds');
      disposeAssembly(batched);
      g.position.fromArray(p.p);
      const geometryRole = g.userData.profileGeometry || p.geometry;
      // Matches the existing engine: exhaust's old local Y/Z origin is compensated.
      if (p.b === 'exhaust' && !p.geometry) { g.position.y -= .2; g.position.z -= .52; }
      if (p.rot) g.rotation.fromArray(p.rot);
      if (p.scale) g.scale.fromArray(p.scale);
      vehicle.add(g); vehicle.updateMatrixWorld(true);
      const box = bounds(g), size = box.getSize(new THREE.Vector3()), stats = geometryStats(g, profile.id + '/' + p.id);
      if (box.min.y < .005 - .001) violation(p.id, 'below-ground', boxData(box));
      if (box.min.x < -2.5 || box.max.x > 2.5 || box.min.z < -.97 || box.max.z > .97 || box.max.y > 1.45) violation(p.id, 'outside-normalized-body-envelope', boxData(box));
      const shaft = axis(g, p.b === 'motor' ? [0, 0, 1] : [1, 0, 0]);
      if (p.b === 'motor') {
        if (Math.abs(shaft[2]) < .999) violation(p.id, 'drive-shaft-must-be-transverse', shaft);
        if (Math.abs(Math.abs(p.p[0]) - frame.wheelbase / 2) > .3) violation(p.id, 'drive-unit-must-stay-near-an-axle', p.p);
        motors.push({ id: p.id, x: p.p[0], shaft });
      }
      if (['phevEngine', 'rex', 'dht'].includes(p.b)) {
        if (p.p[0] > -.5) violation(p.id, 'combustion-path-must-stay-in-front-bay', p.p);
        if (Math.abs(shaft[2]) < .999) violation(p.id, 'front-transverse-powertrain-axis', shaft);
      }
      if (p.b === 'reducer' && Math.abs(shaft[2]) < .999) violation(p.id, 'reducer-output-must-be-transverse', shaft);
      if (p.b === 'thermal' && Math.abs(axis(g, [0, 0, 1])[0]) < .999) violation(p.id, 'radiator-fan-must-face-vehicle-length', p.rot);
      if (p.b === 'battery' && geometryRole !== 'tunnelBattery' && axis(g, [0, 1, 0])[1] < .999) violation(p.id, 'battery-must-remain-flat', p.rot);
      if (geometryRole === 'tunnelBattery' && size.x / size.z < 4) violation(p.id, 'battery-no-longer-central-tunnel', vector(size));
      const children = geometryRole?.endsWith('TankSet') ? g.children : [g];
      for (const child of children) physical.push({ id: p.id + (child === g ? '' : '/' + child.name), parent: p.id, box: bounds(child) });
      const tankAxes = geometryRole?.endsWith('TankSet') ? g.children.map(t => axis(t, [1, 0, 0])) : undefined;
      if (tankAxes && tankAxes.length !== 3) violation(p.id, 'three-pressure-vessels-required', tankAxes);
      if (geometryRole === 'miraiTankSet' && !(Math.abs(tankAxes[0][0]) > .999 && tankAxes.slice(1).every(a => Math.abs(a[2]) > .999))) violation(p.id, 'Mirai-T-topology-was-rotated', tankAxes);
      if (geometryRole === 'nexoTankSet' && !tankAxes.every(a => Math.abs(a[2]) > .999)) violation(p.id, 'NEXO-transverse-topology-was-rotated', tankAxes);
      parts.push({ id: p.id, b: p.b, geometry: p.geometry, geometryRole, component: g.userData.vehicleComponent, installationFit: g.userData.installationFit, ...stats, ...boxData(box), shaft, tankAxes });
    }
    const overlaps = [];
    // A compound tank group's AABB contains deliberate empty space; test its
    // actual vessel child boxes. Small mating/flange overlaps are reported but
    // only substantial mutual penetration fails this architecture-level check.
    for (let i = 0; i < physical.length; i++) for (let j = i + 1; j < physical.length; j++) {
      const a = physical[i], b = physical[j], intersection = a.box.clone().intersect(b.box);
      if (intersection.isEmpty()) continue;
      const overlap = intersection.getSize(new THREE.Vector3()), volume = overlap.x * overlap.y * overlap.z;
      const va = a.box.getSize(new THREE.Vector3()), vb = b.box.getSize(new THREE.Vector3());
      const fraction = volume / Math.min(va.x * va.y * va.z, vb.x * vb.y * vb.z);
      if (Math.min(...overlap.toArray()) < .003) continue;
      const severe = Math.min(...overlap.toArray()) > .045 && fraction > .2;
      overlaps.push({ parts: [a.id, b.id], overlap: vector(overlap), smallerVolumeFraction: round(fraction), severe });
      if (severe) violation(a.id + ' / ' + b.id, 'substantial-assembly-overlap', overlaps.at(-1));
    }
    const front = motors.some(m => m.x < -.6), rear = motors.some(m => m.x > .6);
    const layout = front && rear ? 'AWD' : front ? 'FWD' : rear ? 'RWD' : 'none';
    const actualLocations = motors.map(m => m.x < 0 ? 'front' : 'rear').sort();
    if (JSON.stringify(actualLocations) !== JSON.stringify([...(profile.architecture?.electricDriveLocations || [])].sort())) violation('drivetrain', 'visible-electric-axles-disagree-with-researched-metadata', actualLocations);
    const intended = { 'su7-rwd-2024': 'RWD', 'atto3-fwd-2023': 'FWD', 'model3-rwd-2023': 'RWD', 'xc60-t8-er-2022': 'RWD', 'li-l7-2023': 'AWD', 'mirai-gen2-2021': 'RWD', 'nexo-2018': 'FWD' }[profile.id];
    // XC60's motor group is ERAD; its ICE/automatic separately drives front wheels.
    if (layout !== intended) violation('drivetrain', 'electric-drive-axle-layout', { expected: intended, actual: layout });
    if (profile.id === 'xc60-t8-er-2022' && (!parts.some(p => p.geometryRole === 'tunnelBattery') || !parts.some(p => p.geometryRole === 'transverseAutomatic'))) violation('architecture', 'XC60-requires-tunnel-pack-and-automatic');
    if (profile.id === 'mirai-gen2-2021' && !parts.some(p => p.geometryRole === 'miraiTankSet')) violation('architecture', 'Mirai-requires-T-tank-set');
    if (profile.id === 'nexo-2018' && !parts.some(p => p.geometryRole === 'nexoTankSet')) violation('architecture', 'NEXO-requires-three-transverse-tanks');
    report.profiles[profile.id] = { parts, overlaps, electricDriveLayout: layout, roadDrivenAxles: profile.architecture?.drivenAxles, motors, ...boxData(bounds(vehicle)), groundClearance: round(Math.min(...parts.map(p => p.min[1]))) };
    disposeAssembly(vehicle);
  }
}
report.distinctVehicleComponentGeometries = componentSignatures.size;
const output = process.argv.find(a => a.startsWith('--report='));
if (output) await writeFile(output.slice(9), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ specialGeometries: Object.keys(report.geometry).length, vehicles: Object.keys(report.profiles).length, distinctVehicleComponents: componentSignatures.size, violations: report.violations, summary: Object.fromEntries(Object.entries(report.profiles).map(([id, p]) => [id, { parts: p.parts.length, electricDrive: p.electricDriveLayout, minY: p.groundClearance, majorOverlaps: p.overlaps.filter(o => o.severe).length }])) }, null, 2));
assert.equal(report.violations.length, 0, 'Vehicle profile geometry/layout verification: ' + JSON.stringify(report.violations));
