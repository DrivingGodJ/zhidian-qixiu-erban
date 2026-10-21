// Vehicle-specific structure reconstructions, not OEM CAD. Public sources establish
// the cell family, integration, motor/engine type and assembly outline. Plate/cell/
// pole/tooth counts below are teaching samples, never OEM manufacturing dimensions.
// No generic complete motor, battery, inverter or engine builder is used here.
import * as THREE from 'three';
import { roundedBox, finishPalette, finishMaterial, fastener, connector, cable } from './model-quality.js';
import { tunnelBattery, transverseAutomatic, miraiTankSet, nexoTankSet } from './vehicle-profile-geometry.js';

function mesh(g, name, geometry, material, p = [0, 0, 0]) {
  const m = new THREE.Mesh(geometry, material); m.name = name; m.position.fromArray(p);
  m.castShadow = m.receiveShadow = true; m.userData.manufacturingDetail = true; g.add(m); return m;
}
const box = (g, n, p, s, m) => mesh(g, n, roundedBox(...s), m, p);
function cy(g, n, p, r, len, mat, axis = 'z', r2 = r) {
  const m = mesh(g, n, new THREE.CylinderGeometry(r, r2, len, 40), mat, p);
  if (axis === 'z') m.rotation.x = Math.PI / 2; else if (axis === 'x') m.rotation.z = Math.PI / 2;
  return m;
}
function ring(g, n, p, outer, inner, len, mat, axis = 'z') {
  const points = [[inner, -len / 2], [outer, -len / 2], [outer, len / 2], [inner, len / 2], [inner, -len / 2]].map(a => new THREE.Vector2(...a));
  const m = mesh(g, n, new THREE.LatheGeometry(points, 40), mat, p);
  if (axis === 'z') m.rotation.x = Math.PI / 2; else if (axis === 'x') m.rotation.z = Math.PI / 2;
  return m;
}
function gear(g, n, p, r, teeth, mat) {
  const s = new THREE.Shape();
  for (let i = 0; i < teeth * 4; i++) { const a = i * Math.PI * 2 / (teeth * 4), d = r * (i % 4 < 2 ? .9 : 1); i ? s.lineTo(Math.cos(a) * d, Math.sin(a) * d) : s.moveTo(Math.cos(a) * d, Math.sin(a) * d); }
  s.closePath(); const hole = new THREE.Path(); hole.absarc(0, 0, r * .18, 0, Math.PI * 2, true); s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: .025, bevelEnabled: true, bevelThickness: .0015, bevelSize: .0015, bevelSegments: 1, steps: 1 }); geo.translate(0, 0, -.0125); geo.rotateY(Math.PI / 2);
  return mesh(g, n, geo, mat, p);
}
function cellMaterial() { return finishMaterial(new THREE.MeshStandardMaterial({ color: 0x98a6a9, metalness: .52, roughness: .46 })); }
function ribs(g, f, axis, count, p, size, spacing) {
  for (let i = 0; i < count; i++) { const at = [...p]; at[axis] += (i - (count - 1) / 2) * spacing; box(g, 'casting_rib_' + i, at, size, f.aluminum); }
}
function packFrame(g, f, len, width, height = .17, split = false) {
  box(g, 'cold_plate', [0, -.04, 0], [len, .05, width], f.aluminum);
  for (const sign of [-1, 1]) {
    box(g, 'longitudinal_crash_rail', [0, .035, sign * (width / 2 - .024)], [len, height, .048], f.steel);
    box(g, 'end_beam', [sign * (len / 2 - .022), .03, 0], [.044, height, width], f.aluminum);
    for (let i = 0; i < 7; i++) fastener(g, -len * .43 + i * len * .143, .122, sign * width * .46, .008, f.steel);
  }
  if (split) box(g, 'central_service_gallery', [0, .035, 0], [len * .96, .13, .045], f.steel);
}
function bladePack(kind, opt) {
  const g = new THREE.Group(), f = finishPalette(), su7 = kind === 'su7', len = opt.len || (su7 ? 2.3 : 2.05), width = su7 ? .97 : .92;
  packFrame(g, f, len, width, su7 ? .18 : .15); const cell = cellMaterial(), count = su7 ? 32 : 26, step = (len - .16) / count;
  for (let i = 0; i < count; i++) {
    const x = -len / 2 + .08 + step * (i + .5);
    box(g, 'sample_blade_cell_' + i, [x, .04, 0], [step * .84, .12, width * .88], cell);
    for (const side of [-1, 1]) box(g, 'blade_end_terminal', [x, .105, side * width * .397], [step * .58, .009, .035], f.copper);
    if (i < count - 1) box(g, 'alternating_series_link', [x + step / 2, .114, (i % 2 ? 1 : -1) * width * .397], [step * .8, .008, .025], f.copper);
  }
  if (su7) {
    box(g, 'CTB_partial_upper_structural_panel', [-len * .37, .14, 0], [len * .22, .035, width * .95], f.aluminum);
    for (const x of [-len * .24, len * .26]) box(g, 'CTB_body_crossmember', [x, .135, 0], [.045, .065, width], f.steel);
    box(g, 'rear_HV_header', [len * .4, .16, 0], [.23, .06, .25], f.rubber);
  } else {
    box(g, 'blade_pack_partial_lid', [0, .135, -width * .35], [len * .96, .025, width * .22], f.aluminum);
    ribs(g, f, 0, 9, [0, -.061, 0], [.018, .016, width * .92], len * .1);
    box(g, 'front_junction_compartment', [-len * .39, .145, .23], [.23, .045, .2], f.rubber);
  }
  for (const z of [-.23, .23]) connector(g, [-len / 2 - .025, .025, z], .022, .05, z < 0 ? f.orange : f.aluminum, 'x');
  g.userData.cellForm = 'long-prismatic-blade'; g.userData.sampleCells = count;
  return g;
}
function model3Case(opt) {
  const g = new THREE.Group(), f = finishPalette(), len = opt.len || 2.3;
  // The documented case/connection outline is shown closed. No unsupported
  // 4680, supplier, module count or cell chemistry is inferred for this year/market.
  const shape = new THREE.Shape(); shape.moveTo(-len / 2, -.4); shape.lineTo(-len / 2 + .1, -.49); shape.lineTo(len / 2 - .18, -.49); shape.lineTo(len / 2, -.36); shape.lineTo(len / 2, .36); shape.lineTo(len / 2 - .18, .49); shape.lineTo(-len / 2 + .1, .49); shape.lineTo(-len / 2, .4); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: .12, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 2, steps: 1 }); geo.rotateX(Math.PI / 2); geo.translate(0, .062, 0);
  mesh(g, 'sealed_Model3_HV_battery_case', geo, f.aluminum);
  box(g, 'rear_penthouse_and_HV_header', [len * .34, .13, 0], [.38, .13, .66], f.steel);
  box(g, 'penthouse_service_lid', [len * .34, .195, 0], [.35, .012, .62], f.aluminum);
  for (let i = 0; i < 9; i++) ribs(g, f, 2, 2, [-len * .39 + i * len * .095, .078, 0], [.018, .017, .42], .44);
  for (const z of [-.475, .475]) for (let i = 0; i < 11; i++) fastener(g, -len * .44 + i * len * .088, .075, z, .0075, f.steel);
  for (const z of [-.18, .18]) connector(g, [len / 2 + .029, .105, z], .027, .058, z < 0 ? f.orange : f.aluminum, 'x');
  g.userData.cellForm = 'unexposed-not-inferred'; return g;
}
function modularPack(kind, opt) {
  const g = new THREE.Group(), f = finishPalette(), len = opt.len || (kind === 'li' ? 1.5 : .64), buffer = kind !== 'li', width = buffer ? .9 : .98, m = cellMaterial();
  packFrame(g, f, len, width, buffer ? .15 : .18, kind === 'li');
  if (kind === 'li') {
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
      const x = -len * .36 + i * len * .24;
      box(g, 'sample_2023_L7_module_' + i + '_' + side, [x, .04, side * .235], [len * .215, .13, .405], m);
      ribs(g, f, 0, 4, [x, .112, side * .235], [.012, .009, .36], len * .044);
      box(g, 'module_link', [x, .125, side * .08], [.08, .008, .04], f.copper);
    }
    box(g, 'L7_partial_cover', [len * .35, .15, 0], [len * .22, .02, .91], f.aluminum);
    box(g, 'L7_front_service_disconnect', [-len * .4, .135, 0], [.14, .045, .12], f.orange);
  } else if (kind === 'mirai') {
    // Mirai2's compact rear lithium-ion buffer is distinct from the traction pack.
    for (let i = 0; i < 6; i++) box(g, 'sample_LiIon_buffer_module_' + i, [0, .045, -.34 + i * .136], [len * .8, .125, .118], m);
    box(g, 'rear_buffer_electronics', [-len * .36, .145, 0], [len * .2, .05, .76], f.rubber);
    for (const z of [-.3, .3]) box(g, 'buffer_busbar', [0, .116, z], [len * .63, .008, .025], f.copper);
  } else {
    // NEXO1's broad, shallow rear power buffer uses stacked module slabs.
    for (const x of [-len * .225, len * .225]) for (let i = 0; i < 5; i++) box(g, 'sample_polymer_buffer_layer', [x, .01 + i * .025, 0], [len * .4, .018, .72], i % 2 ? f.aluminum : m);
    box(g, 'NEXO_rear_power_buffer_cover', [0, .154, -.3], [len * .95, .025, .22], f.aluminum);
    box(g, 'NEXO_side_service_box', [len * .39, .06, 0], [len * .16, .12, .76], f.rubber);
  }
  connector(g, [-len / 2 - .025, .04, -.22], .025, .05, f.orange, 'x');
  return g;
}

// Common electromechanical primitives; each vehicle has a different casting,
// integration, winding/end-turn presentation and mount/connector arrangement.
function electricMotor(kind, opt) {
  const g = new THREE.Group(), f = finishPalette(), r = opt.r || .18, len = opt.len || .4;
  const spec = {
    su7: [12, 8, 'long-ribbed-IPMSM'], atto: [7, 6, '8-in-1-flat-top'], model3: [6, 6, 'compact-3DU-PM'],
    volvo: [5, 8, 'ERAD-rear-module'], liFront: [4, 8, 'five-in-one-front'], liRear: [9, 6, 'three-in-one-rear'],
    mirai: [8, 8, 'Mirai2-rear-transaxle'], nexo: [6, 6, 'NEXO1-front-drive']
  }[kind];
  ring(g, 'open_stator_casting', [0, 0, 0], r, r * .78, len, f.aluminum);
  cy(g, 'laminated_PM_rotor', [0, 0, 0], r * .54, len * .87, f.steel);
  cy(g, 'transverse_motor_shaft', [0, 0, 0], r * .15, len + .05, f.steel);
  for (let i = 0; i < spec[1]; i++) {
    const a = i * Math.PI * 2 / spec[1];
    // Buried paired magnet samples express synchronous PM operation, not a
    // copper squirrel cage. Pole count is deliberately an illustrative sample.
    for (const side of [-1, 1]) { const magnet = box(g, 'sample_buried_PM_segment', [Math.cos(a) * r * .43, Math.sin(a) * r * .43, len * .455], [r * .35, r * .075, .015], f.rubber); magnet.rotation.z = a + side * .38; }
  }
  for (const side of [-1, 1]) {
    ring(g, 'bearing_end_carrier', [0, 0, side * len * .48], r * .96, r * .59, .025, f.aluminum);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      const turn = new THREE.Mesh(new THREE.TorusGeometry(r * .115, r * .025, 8, 12, Math.PI), f.copper);
      turn.name = 'sample_copper_end_turn'; turn.position.set(Math.cos(a) * r * .68, Math.sin(a) * r * .68, side * len * .49); turn.rotation.set(side * Math.PI / 2, 0, a); g.add(turn);
    }
  }
  if (kind === 'model3') {
    for (const z of [-len * .3, len * .3]) ring(g, '3DU_scalloped_mount', [0, -.018, z], r * 1.04, r * .93, .018, f.aluminum);
    box(g, '3DU_flat_terminal_casting', [r * .2, r * .85, 0], [r * 1.42, r * .63, len * .74], f.aluminum);
    for (const x of [-r * .7, r * .7]) box(g, '3DU_mount_ear', [x, -r * .92, 0], [r * .38, .04, len * .56], f.steel);
  } else if (kind === 'atto' || kind === 'liFront') {
    box(g, 'integrated_electronics_support_casting', [0, r * .92, 0], [r * 1.86, r * .55, len * .96], f.aluminum);
    const zones = kind === 'atto' ? 4 : 2;
    for (let i = 0; i < zones; i++) box(g, 'integrated_auxiliary_function_bay_' + i, [-r * .63 + i * r * 1.26 / Math.max(1, zones - 1), r * 1.25, -.015], [r * 1.08 / zones, r * .24, len * .7], f.steel);
    ribs(g, f, 2, kind === 'atto' ? 5 : 3, [0, r * 1.4, 0], [r * 1.65, .009, .012], len * .14);
  } else if (kind === 'volvo') {
    box(g, 'ERAD_saddle_carrier', [0, -r * .87, 0], [r * 1.84, .052, len * .84], f.aluminum);
    box(g, 'ERAD_angled_service_terminal', [-r * .2, r, -.015], [r * 1.25, .08, len * .56], f.steel).rotation.z = -.12;
  } else if (kind === 'mirai') {
    box(g, 'rear_transaxle_upper_web', [0, r * .84, 0], [r * 1.85, .07, len * .86], f.aluminum);
    cy(g, 'Mirai_mount_bushing', [r * .77, -r * .74, 0], .03, len * .75, f.rubber);
  } else if (kind === 'nexo') {
    box(g, 'NEXO_front_mount_bridge', [0, -r * .81, 0], [r * 1.93, .048, len * .93], f.aluminum);
    box(g, 'NEXO_tall_terminal_pod', [0, r * 1.03, -.03], [r * 1.32, .11, len * .55], f.steel);
  } else if (kind === 'liRear') {
    box(g, 'rear_three_in_one_spine', [0, r * .92, 0], [r * 1.8, .08, len * .9], f.aluminum);
    for (const x of [-r * .8, r * .8]) box(g, 'rear_crossmember_mount', [x, -r * .78, 0], [r * .38, .04, len * .8], f.steel);
  } else {
    box(g, 'SU7_drive_mount_saddle', [0, -r * .91, 0], [r * 1.96, .045, len * .8], f.aluminum);
    box(g, 'SU7_upper_HV_terminal', [-r * .28, r * 1.08, 0], [r * 1.24, .07, len * .6], f.steel);
  }
  for (let i = 0; i < spec[0]; i++) { const a = i * Math.PI * 2 / spec[0]; const rib = box(g, 'vehicle_specific_barrel_rib', [Math.cos(a) * r, Math.sin(a) * r, 0], [.012, .012, len * .78], f.aluminum); rib.rotation.z = a; }
  connector(g, [-r * .25, r * 1.39, -.02], .019, .055, f.orange);
  g.userData.rotorType = 'permanent-magnet-synchronous'; g.userData.casting = spec[2];
  return g;
}
function reduction(kind) {
  const g = new THREE.Group(), f = finishPalette(), spec = { su7: [.183, .128, 24, 16], atto: [.17, .14, 28, 18], model3: [.176, .125, 30, 17], volvo: [.157, .115, 22, 14], liFront: [.17, .125, 20, 13], liRear: [.19, .132, 26, 18], mirai: [.175, .13, 25, 16], nexo: [.166, .135, 23, 15] }[kind];
  ring(g, kind + '_gear_case', [0, 0, 0], spec[0], spec[0] * .84, .25, f.aluminum, 'x');
  ring(g, 'differential_lobe', [0, -.12, .025], spec[1], spec[1] * .8, .28, f.aluminum, 'x');
  box(g, 'cast_case_bridge', [-.045, -.06, 0], [.17, .22, .22], f.aluminum);
  gear(g, 'sample_input_reduction_gear', [.135, .046, -.025], spec[0] * .67, spec[3], f.steel);
  gear(g, 'sample_differential_ring_gear', [.15, -.12, .025], spec[1] * .82, spec[2], f.steel);
  for (const side of [-1, 1]) {
    cy(g, 'splined_output_stub', [side * .2, -.12, .025], .049, .105, f.steel, 'x');
    ring(g, 'output_oil_seal', [side * .165, -.12, .025], .067, .05, .025, f.rubber, 'x');
    for (let i = 0; i < 5; i++) ring(g, 'shaft_spline_band', [side * (.178 + i * .012), -.12, .025], .05, .046, .004, f.steel, 'x');
  }
  const mounts = kind === 'model3' ? 3 : kind === 'atto' ? 4 : 2;
  for (let i = 0; i < mounts; i++) { const a = (i / mounts) * Math.PI * 2; box(g, 'vehicle_specific_mount', [-.04, Math.cos(a) * spec[0] * .95, Math.sin(a) * spec[0] * .95], [.14, .04, .04], f.aluminum); }
  if (kind === 'atto' || kind === 'liFront') box(g, 'integrated_drive_flat_bridge', [0, .16, 0], [.25, .045, .28], f.aluminum);
  if (kind === 'model3') ribs(g, f, 2, 6, [-.07, -.05, 0], [.2, .015, .012], .044);
  else ribs(g, f, 0, kind === 'volvo' ? 4 : 6, [0, -.226, .025], [.011, .025, .15], .036);
  g.userData.gearArchitecture = 'vehicle-specific-single-speed-parallel-reduction'; return g;
}
function electronics(kind) {
  const g = new THREE.Group(), f = finishPalette(), pcb = new THREE.MeshStandardMaterial({ color: 0x285347, metalness: .12, roughness: .68 });
  box(g, kind + '_machined_cold_plate', [0, -.07, 0], [.37, .045, .285], f.aluminum);
  for (const z of [-.139, .139]) box(g, 'partial_cast_case_wall', [0, -.015, z], [.37, .115, .012], f.aluminum);
  const compact = kind === 'volvo', stagger = kind === 'model3', atto = kind === 'atto';
  for (let i = 0; i < 3; i++) {
    const x = -.112 + i * .105, z = stagger ? (i % 2 ? .042 : -.025) : -.035;
    box(g, 'three_phase_power_stage_' + i, [x, -.027, z], [.078, .035, .1], f.ceramic);
    box(g, 'laminated_phase_busbar', [x, 0, z], [.05, .01, .075], f.copper);
  }
  if (atto) {
    box(g, 'eight_in_one_logic_deck', [0, .047, .04], [.32, .012, .13], pcb);
    for (let i = 0; i < 4; i++) box(g, 'integrated_logic_function_zone', [-.12 + i * .08, .063, .03], [.058, .025, .065], f.rubber);
    ring(g, 'integrated_auxiliary_inductor', [.1, .1, -.07], .04, .02, .035, f.copper, 'y');
    box(g, 'integrated_OBC_DCDC_partial_lid', [-.095, .1, -.06], [.13, .055, .13], f.aluminum);
  } else if (kind === 'model3') {
    for (const x of [-.13, -.07, -.01, .05]) box(g, '3DU_film_capacitor_bank', [x, .047, -.087], [.047, .08, .08], f.rubber);
    box(g, '3DU_gate_driver', [.07, .042, .075], [.17, .015, .08], pcb);
    box(g, '3DU_side_header', [.18, .045, .01], [.045, .11, .19], f.aluminum);
  } else if (compact) {
    box(g, 'ERAD_long_film_capacitor', [0, .045, -.075], [.28, .08, .075], f.rubber);
    box(g, 'ERAD_control_module', [0, .043, .073], [.26, .018, .08], pcb);
    ribs(g, f, 0, 5, [0, -.092, 0], [.012, .012, .25], .059);
  } else {
    const caps = kind === 'liRear' ? 2 : 3;
    for (let i = 0; i < caps; i++) cy(g, kind + '_DC_link_capacitor', [-.11 + i * .11, .065, -.075], .033, .085, f.steel, 'y');
    box(g, 'gate_driver_board', [0, .052, .085], [.29, .014, .07], pcb);
    if (kind === 'su7') box(g, 'SU7_stepped_top_casting', [-.11, .102, .025], [.12, .05, .14], f.aluminum);
    if (kind === 'liRear') box(g, 'three_in_one_rear_deck_lid', [0, .111, -.035], [.29, .025, .1], f.aluminum);
  }
  for (const side of [-1, 1]) connector(g, [side * .2, .012, atto ? .025 : -.01], .023, .06, f.orange, 'x');
  for (const x of [-.16, .16]) for (const z of [-.115, .115]) fastener(g, x, -.025, z, .009, f.steel);
  return g;
}
function fourCylinder(kind) {
  const g = new THREE.Group(), f = finishPalette(), li = kind === 'li';
  box(g, 'open_crankcase_base', [0, -.12, 0], [.56, .09, .4], f.aluminum);
  box(g, 'ribbed_oil_sump', [0, -.22, 0], [.47, .12, .36], f.steel);
  for (const side of [-1, 1]) box(g, 'crankcase_side_wall', [0, -.025, side * .19], [.56, .25, .025], f.aluminum);
  cy(g, 'four_cylinder_crankshaft', [0, -.08, 0], .028, .62, f.steel, 'x');
  for (let i = 0; i < 4; i++) {
    const x = -.2 + i * .132;
    ring(g, 'sample_cylinder_liner_' + i, [x, .12, 0], .063, .052, .2, f.aluminum, 'y');
    cy(g, 'sample_piston_' + i, [x, .11 + (i % 2) * .035, 0], .05, .058, f.steel, 'y');
    box(g, 'sample_connecting_rod', [x, .005, 0], [.025, .16, .025], f.steel);
    box(g, 'ignition_coil', [x, .322, 0], [.064, .038, .09], f.rubber);
    cable(g, [[x, .19, -.12], [x, .13, -.21], [x + .025, .08, -.22]], .018, f.aluminum);
  }
  box(g, li ? 'L7_turbo_four_cylinder_head' : 'Volvo_four_cylinder_cam_cover', [0, .274, 0], [.52, .065, .32], f.steel);
  cy(g, 'oil_filler_cap', [.14, .327, .095], .03, .025, f.rubber, 'y');
  box(g, 'timing_end_cover', [.277, .05, 0], [.055, .46, .32], f.aluminum);
  cy(g, 'crank_pulley', [.312, -.05, -.01], .073, .024, f.steel, 'x');
  cy(g, 'turbo_compressor_housing', [-.14, .12, .2], .058, .09, f.aluminum, 'x');
  box(g, 'exhaust_heat_shield', [0, .12, .2], [.39, .16, .055], f.steel);
  if (li) box(g, 'range_extender_acoustic_cover', [0, .327, -.09], [.48, .04, .14], f.rubber);
  else box(g, 'Volvo_high_pressure_injection_rail', [0, .25, -.185], [.44, .035, .025], f.steel);
  g.userData.cylinders = 4; return g;
}
function liRex() {
  const g = new THREE.Group(), f = finishPalette(), engine = fourCylinder('li'); engine.scale.setScalar(.8); engine.position.x = -.19; g.add(engine);
  const generator = new THREE.Group(); generator.name = 'coaxial_range_extender_generator'; generator.position.x = .31; g.add(generator);
  ring(generator, 'generator_open_casting', [0, 0, 0], .157, .12, .29, f.aluminum, 'x');
  cy(generator, 'generator_PM_rotor', [0, 0, 0], .085, .25, f.steel, 'x');
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; cy(generator, 'generator_copper_winding', [0, Math.cos(a) * .118, Math.sin(a) * .118], .013, .27, f.copper, 'x'); }
  cy(g, 'engine_generator_flywheel_coupling', [.07, 0, 0], .133, .06, f.steel, 'x');
  box(g, 'L7_isolated_genset_subframe', [0, -.255, 0], [.94, .035, .4], f.aluminum);
  for (const x of [-.34, .34]) for (const z of [-.15, .15]) cy(g, 'genset_rubber_mount', [x, -.265, z], .027, .03, f.rubber, 'y');
  g.userData.engineDrivesWheels = false; return g;
}
function liFuelTank(opt) {
  const g = new THREE.Group(), f = finishPalette(), len = opt.len || .5, width = opt.w || .82;
  box(g, 'moulded_L7_fuel_reservoir', [0, 0, 0], [len, .245, width], f.rubber);
  for (const side of [-1, 1]) box(g, 'contoured_tank_side_lobe', [side * len * .38, -.018, 0], [len * .32, .19, width * .91], f.rubber);
  for (const x of [-len * .26, len * .26]) { box(g, 'steel_retention_band', [x, 0, 0], [.035, .28, width * 1.01], f.steel); cy(g, 'tank_mounting_eye', [x, .13, width * .42], .022, .022, f.steel, 'y'); }
  cy(g, 'fuel_pump_service_flange', [-len * .14, .137, 0], .071, .025, f.aluminum, 'y');
  cy(g, 'sealed_pump_header', [-len * .14, .164, 0], .05, .028, f.rubber, 'y');
  cable(g, [[len * .2, .1, width * .37], [len * .25, .18, width * .46], [len * .3, .18, width * .57]], .02, f.rubber);
  return g;
}
function fuelSystem(kind) {
  const g = new THREE.Group(), f = finishPalette(), mirai = kind === 'mirai', count = mirai ? 22 : 30, span = mirai ? .31 : .35;
  for (let i = 0; i < count; i++) box(g, 'sample_bipolar_plate_' + i, [-span / 2 + i * span / (count - 1), -.035, 0], [.007, mirai ? .25 : .23, mirai ? .46 : .43], i % 2 ? f.steel : f.aluminum);
  for (const side of [-1, 1]) box(g, 'pressure_end_plate', [side * (span / 2 + .017), -.035, 0], [.03, .29, .49], f.aluminum);
  for (const y of [-.15, .075]) for (const z of [-.21, .21]) cy(g, 'compression_tie_rod', [0, y, z], .01, span + .07, f.steel, 'x');
  box(g, 'fuel_system_carrier', [0, -.193, 0], [.43, .025, .52], f.aluminum);
  if (mirai) {
    box(g, 'Mirai2_integrated_boost_PCU_deck', [0, .118, -.035], [.42, .08, .43], f.aluminum);
    ring(g, 'sample_boost_inductor', [-.08, .165, -.08], .046, .024, .025, f.copper, 'y');
    for (let i = 0; i < 3; i++) box(g, 'sample_PCU_power_stage', [.02 + i * .052, .165, -.08], [.04, .018, .09], f.ceramic);
    box(g, 'Mirai_stack_front_air_manifold', [0, -.02, .265], [.34, .14, .04], f.steel);
    ribs(g, f, 0, 6, [0, .175, .07], [.013, .01, .1], .055);
  } else {
    box(g, 'NEXO1_power_module_side_deck', [-.045, .118, -.04], [.33, .085, .4], f.aluminum);
    cy(g, 'NEXO_membrane_humidifier', [.145, .015, .145], .047, .3, f.steel, 'z');
    cy(g, 'NEXO_air_auxiliary_drum', [-.15, -.055, .26], .054, .13, f.aluminum, 'x');
    for (let i = 0; i < 4; i++) box(g, 'NEXO_auxiliary_manifold_channel', [-.13 + i * .077, .17, -.06], [.04, .016, .24], f.steel);
  }
  for (const side of [-1, 1]) connector(g, [side * .11, -.03, .323], .023, .075, f.aluminum, 'z');
  g.userData.samplePlates = count; g.userData.fuelSystemArchitecture = mirai ? 'Mirai2-integrated-front-system' : 'NEXO1-front-stack-and-air-auxiliaries';
  return g;
}

const ENVELOPE = {
  reducer: [[-.26, -.2925, -.203], [.26, .2287, .203]], inverter: [[-.247, -.1, -.15], [.238, .16, .15]],
  engine: [[-.4228, -.283, -.263], [.325, .4098, .263]], rex: [[-.5394, -.2825, -.2251], [.5321, .3495, .2235]],
  fuelTank: [[-.414, -.145, -.419], [.414, .252, .54]], fuelStack: [[-.232, -.208, -.28], [.232, .181, .377]]
};
function fitEnvelope(g, role, opt) {
  let limits = ENVELOPE[role];
  if (role === 'battery') { const len = opt.len || 1.7; limits = [[-len / 2 - .09, -.07, -.5011], [len / 2 + .09, .201, .5011]]; }
  if (role === 'motor') { const r = opt.r || .18, len = opt.len || .4; limits = [[-Math.max(r + .027, .1848), -r - .027, -Math.max(len / 2 + .03, .198)], [r + .027, r + .1895, Math.max(len / 2 + .03, .2121)]]; }
  if (!limits) return g;
  const b = new THREE.Box3().setFromObject(g), min = b.min.toArray(), max = b.max.toArray(); let factor = 1;
  for (let i = 0; i < 3; i++) { if (min[i] < limits[0][i]) factor = Math.min(factor, limits[0][i] / min[i]); if (max[i] > limits[1][i]) factor = Math.min(factor, limits[1][i] / max[i]); }
  // Uniform fitting preserves cell/rotor proportions and all established profile
  // transforms. Never flatten a completed assembly along one axis to make it fit.
  if (factor < 1) { const inner = new THREE.Group(); inner.name = 'proportion_preserving_installation_fit'; while (g.children.length) inner.add(g.children[0]); inner.scale.setScalar(factor); g.add(inner); }
  g.userData.installationFit = factor; return g;
}
function component(vehicle, role, create, features, fitRole = role) {
  return (opt = {}) => {
    const g = fitEnvelope(create(opt), fitRole, opt); g.name = vehicle + '_' + role;
    g.userData.vehicleComponent = { vehicle, role, features, scope: '对应车型公开结构重建 · 内部数量与尺寸为抽样示意 · 非原厂 CAD' };
    return g;
  };
}

export const VEHICLE_COMPONENT_BUILDERS = Object.freeze({
  su7BladePack: component('su7-2024-standard', 'battery', o => bladePack('su7', o), '弗迪 Blade 长方片电芯、CTB 车身横梁与后端高压接口'),
  su7RearMotor: component('su7-2024-standard', 'motor', o => electricMotor('su7', o), '后置永磁同步、长肋条筒体与上置接线座'),
  su7Reducer: component('su7-2024-standard', 'reducer', () => reduction('su7'), '双叶铸壳、平行轴减速与差速器'),
  su7Inverter: component('su7-2024-standard', 'inverter', () => electronics('su7'), '阶梯压铸盖、三相功率级和直流母线'),
  atto3BladePack: component('atto3-2023', 'battery', o => bladePack('atto', o), 'Blade 长片阵列、独立底托与前部接线区'),
  atto3EightMotor: component('atto3-2023', 'motor', o => electricMotor('atto', o), '八合一前驱的平顶共壳、辅助功能舱与永磁电机'),
  atto3Reducer: component('atto3-2023', 'reducer', () => reduction('atto'), '八合一共壳连接面、四点支座和平行减速齿轮'),
  atto3PowerDeck: component('atto3-2023', 'inverter', () => electronics('atto'), '八合一分层电控、逻辑区与辅助电源功能层'),
  model3BatteryCase: component('model3-2023-rwd', 'battery', model3Case, '封闭多边形电池壳、后部 penthouse 与冷却/高压接口'),
  model3RearMotor: component('model3-2023-rwd', 'motor', o => electricMotor('model3', o), '3DU 后永磁同步、紧凑扁顶与耳式安装座'),
  model3Reducer: component('model3-2023-rwd', 'reducer', () => reduction('model3'), '3DU 三点支座、密集筋条和平行轴单速齿轮'),
  model3Inverter: component('model3-2023-rwd', 'inverter', () => electronics('model3'), '3DU 阶梯功率级、扁平薄膜电容与侧置母线头'),
  volvoFourCylinder: component('xc60-t8-er', 'engine', () => fourCylinder('volvo'), '前横置四缸、凸轮盖、喷油轨、涡轮与曲轴剖示'),
  volvoEightAT: component('xc60-t8-er', 'transmission', transverseAutomatic, '前横置自动变速总成', 'none'),
  volvoTunnelPack: component('xc60-t8-er', 'battery', tunnelBattery, 'SPA Extended Range 中央窄长隧道电池', 'none'),
  volvoEradMotor: component('xc60-t8-er', 'motor', o => electricMotor('volvo', o), 'ERAD 后桥紧凑电机、鞍形支架与斜置端子盒'),
  volvoEradReducer: component('xc60-t8-er', 'reducer', () => reduction('volvo'), 'ERAD 紧凑后桥差速减速壳与短支座'),
  volvoEradInverter: component('xc60-t8-er', 'inverter', () => electronics('volvo'), 'ERAD 细长电容与独立低矮控制板'),
  liL7Rex: component('li-l7-2023', 'rex', liRex, '1.5T 四缸与同轴发电机、隔振底架；不机械驱动车轮'),
  liL7FrontMotor: component('li-l7-2023-front', 'motor', o => electricMotor('liFront', o), '前五合一的双辅助功能舱与低位电驱铸壳'),
  liL7FrontReducer: component('li-l7-2023-front', 'reducer', () => reduction('liFront'), '低位五合一前驱连接面与减速功能区'),
  liL7Pack: component('li-l7-2023', 'battery', o => modularPack('li', o), '2023 年 42.8kWh 地板包、双列模组与中央检修廊'),
  liL7FuelTank: component('li-l7-2023', 'fuelTank', liFuelTank, '包后模塑燃油箱、泵总成法兰与双固定带'),
  liL7RearMotor: component('li-l7-2023-rear', 'motor', o => electricMotor('liRear', o), '后三合一电驱的宽顶连接脊与副车架支点'),
  liL7RearReducer: component('li-l7-2023-rear', 'reducer', () => reduction('liRear'), '大径差速器叶片壳与后三合一连接面'),
  liL7RearInverter: component('li-l7-2023-rear', 'inverter', () => electronics('liRear'), '后三合一双电容与宽顶电控冷却板'),
  mirai2FuelSystem: component('mirai-gen2', 'fuelStack', () => fuelSystem('mirai'), '第二代前舱电堆、升压/PCU 集成顶层与空气歧管'),
  mirai2TankSet: component('mirai-gen2', 'h2tanks', miraiTankSet, '一纵两横、尺寸不同的 T 形三储氢罐', 'none'),
  mirai2RearMotor: component('mirai-gen2', 'motor', o => electricMotor('mirai', o), '后驱紧凑永磁电机、上部桥架和安装衬套'),
  mirai2Reducer: component('mirai-gen2', 'reducer', () => reduction('mirai'), '后桥分叶壳体、差速器和短花键输出'),
  mirai2BufferPack: component('mirai-gen2', 'battery', o => modularPack('mirai', o), '后排后方小型锂离子缓冲包与横向模块'),
  nexo1FuelSystem: component('nexo-2018', 'fuelStack', () => fuelSystem('nexo'), '第一代前舱长板片阵列、侧加湿器与空气辅助鼓'),
  nexo1FrontMotor: component('nexo-2018', 'motor', o => electricMotor('nexo', o), '前驱永磁电机、下安装桥与高端子舱'),
  nexo1Reducer: component('nexo-2018', 'reducer', () => reduction('nexo'), '前桥紧凑差速铸壳与偏置减速齿轮'),
  nexo1TankSet: component('nexo-2018', 'h2tanks', nexoTankSet, '后三横罐、等形压力容器前后排列', 'none'),
  nexo1BufferPack: component('nexo-2018', 'battery', o => modularPack('nexo', o), '行李厢低平缓冲包、叠层模块与侧检修盒')
});
export function buildVehicleComponentGeometry(kind, opt = {}) {
  const builder = VEHICLE_COMPONENT_BUILDERS[kind];
  if (!builder) throw new TypeError('Unknown vehicle component geometry: ' + kind);
  return builder(opt);
}
