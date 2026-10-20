// Original unbranded teaching body; adapted wheel artwork is credited in assets/ATTRIBUTION.md.
import * as THREE from 'three';
import { loadSU7Shell } from './su7-shell.js';
import { cabin as buildCabin } from './detail.js';
import { batchStaticAssembly } from './static-assembly.js';

export async function loadGenericShell(type = 'suv', {includeCabin = true} = {}) {
  const sedan = type === 'sedan' || type === 'fcev';
  const root = new THREE.Group();
  root.name = sedan ? 'Generic_sedan_shell' : 'Generic_SUV_shell';
  const source = await loadSU7Shell();
  source.updateMatrixWorld(true);
  const wheels = source.userData.wheels;
  for (const wheel of wheels) root.attach(wheel);

  // Keep only the four corrected, unmarked wheel assemblies from the source.
  const kept = new Set();
  const keepMaterial = material => {
    kept.add(material);
    for (const value of Object.values(material)) if (value?.isTexture) kept.add(value);
  };
  for (const wheel of wheels) wheel.traverse(object => {
    if (!object.isMesh) return;
    kept.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) keepMaterial(material);
    object.raycast = () => {};
    object.castShadow = object.receiveShadow = true;
  });
  const disposed = new Set();
  const dispose = resource => {
    if (!resource || kept.has(resource) || disposed.has(resource)) return;
    resource.dispose(); disposed.add(resource);
  };
  source.traverse(object => {
    if (!object.isMesh) return;
    dispose(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      for (const value of Object.values(material)) if (value?.isTexture) dispose(value);
      dispose(material);
    }
  });

  const envelope = new THREE.Group();
  envelope.name = 'Generic_body';
  root.add(envelope);
  // The full teaching car also contains an unbranded cabin. Keep it faint so
  // seats and the dashboard do not obscure the powertrain under the floor.
  const cabinMaterials=new Set();
  let cabin=null;
  if(includeCabin){
    cabin=batchStaticAssembly(buildCabin());cabin.name='Generic_cabin';
    cabin.rotation.y=Math.PI/2;cabin.position.set(-.05,.74,0);cabin.scale.set(1.2,1,1.2);
    cabin.traverse(object=>{if(!object.isMesh)return;object.raycast=()=>{};object.castShadow=false;object.renderOrder=1;for(const material of Array.isArray(object.material)?object.material:[object.material]){material.transparent=true;material.opacity=.055;material.depthWrite=false;material.metalness=0;material.roughness=.9;material.envMapIntensity=.12;cabinMaterials.add(material);}});
    envelope.add(cabin);
  }
  const bodyMaterial = new THREE.MeshStandardMaterial({
    name: 'Generic_body_finish', color: '#8faaa6', metalness: 0, roughness: 0.86,
    side: THREE.DoubleSide, transparent: true, opacity: 0.08, depthWrite: false,
    envMapIntensity: 0.15
  });
  const glassMaterial = bodyMaterial.clone();
  glassMaterial.name = 'Generic_glazing';
  glassMaterial.color.set('#91a9b5');

  // X is the longitudinal axis, with the front at −X. Each loft station stores
  // its X coordinate, upper height and half-width. No production body is reused.
  const stations = sedan ? [
    [-2.3, 0.65, 0.7], [-2.18, 0.8, 0.85], [-1.55, 0.86, 0.95],
    [-0.9, 0.91, 0.96], [0.5, 0.94, 0.96], [1.5, 0.88, 0.95],
    [2.15, 0.78, 0.86], [2.3, 0.67, 0.72]
  ] : [
    [-2.3, 0.72, 0.72], [-2.18, 0.88, 0.85], [-1.55, 0.96, 0.95],
    [-0.9, 0.99, 0.97], [0.5, 1.02, 0.97], [1.5, 1.02, 0.96],
    [2.16, 0.98, 0.88], [2.3, 0.87, 0.76]
  ];
  const curve = new THREE.CatmullRomCurve3(stations.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const centers = wheels.map(wheel => wheel.getWorldPosition(new THREE.Vector3()));
  const axleX = [centers[0].x, centers[2].x];
  function lowerEdge(x) {
    let y = sedan ? 0.2 : 0.26;
    for (const axle of axleX) {
      const dx = x - axle, radius = 0.405;
      if (Math.abs(dx) < radius) y = Math.max(y, centers[0].y + Math.sqrt(radius * radius - dx * dx));
    }
    return y;
  }
  function bodyPoint(station, t, side) {
    const angle = t * Math.PI / 2, s = Math.sin(angle), lower = lowerEdge(station.x);
    return new THREE.Vector3(station.x,
      lower + (station.y - lower) * Math.pow(Math.max(0, Math.cos(angle)), 0.38),
      side * station.z * s * (1 - 0.035 * Math.pow(s, 8)));
  }
  function loft(name, rows, columns, pointAt, material, flip = false) {
    const positions = [], indices = [];
    for (let i = 0; i <= rows; i++) for (let j = 0; j <= columns; j++) {
      positions.push(...pointAt(i / rows, j / columns).toArray());
    }
    for (let i = 0; i < rows; i++) for (let j = 0; j < columns; j++) {
      const a = i * (columns + 1) + j, b = a + columns + 1;
      if (flip) indices.push(a, a + 1, b, a + 1, b + 1, b);
      else indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name; mesh.raycast = () => {};
    envelope.add(mesh);
    return mesh;
  }
  for (const side of [-1, 1]) {
    loft('Generic_body_' + (side < 0 ? 'left' : 'right'), 112, 24,
      (u, v) => bodyPoint(curve.getPoint(u), v, side), bodyMaterial, side > 0);
  }
  // Close the rounded nose and tail. The underside remains open for teaching.
  for (const end of [0, 1]) {
    const station = curve.getPoint(end), ring = [];
    for (let j = 24; j >= 0; j--) ring.push(bodyPoint(station, j / 24, -1));
    for (let j = 1; j <= 24; j++) ring.push(bodyPoint(station, j / 24, 1));
    const center = new THREE.Vector3(station.x, (station.y + lowerEdge(station.x)) / 2, 0);
    const positions = [], normals = [];
    for (let j = 0; j < ring.length; j++) {
      const a = ring[j], b = ring[(j + 1) % ring.length];
      for (const p of end ? [center, a, b] : [center, b, a]) {
        positions.push(...p.toArray()); normals.push(end ? 1 : -1, 0, 0);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    const cap = new THREE.Mesh(geometry, bodyMaterial);
    cap.name = end ? 'Generic_tail' : 'Generic_nose'; cap.raycast = () => {};
    envelope.add(cap);
  }

  const roofStations = sedan ? [
    [-0.96, 0.91, 0.81], [-0.48, 1.3, 0.77], [0.1, 1.43, 0.73],
    [0.75, 1.41, 0.74], [1.25, 1.18, 0.79], [1.68, 0.89, 0.82]
  ] : [
    [-0.98, 0.99, 0.82], [-0.55, 1.48, 0.79], [0.1, 1.65, 0.76],
    [1.2, 1.64, 0.77], [1.8, 1.4, 0.8], [2.03, 1, 0.82]
  ];
  const roof = new THREE.CatmullRomCurve3(roofStations.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const beltHeight = sedan ? 0.91 : 1.0;
  const canopyPoint = (u, v) => {
    const p = roof.getPoint(u), q = v * 2 - 1;
    return new THREE.Vector3(p.x, beltHeight + Math.max(0, p.y - beltHeight) * Math.sqrt(Math.max(0, 1 - q ** 4)), p.z * q);
  };
  loft('Generic_canopy', 80, 48, canopyPoint, glassMaterial, true);

  // Thin window framing gives the transparent silhouette a readable roof line.
  const frameMaterial = new THREE.LineBasicMaterial({color: '#acc0bb', transparent: true, opacity: 0.08, depthWrite: false});
  for (const edge of [0, 1]) {
    const points = Array.from({length: 81}, (_, i) => canopyPoint(i / 80, edge));
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), frameMaterial);
    line.raycast = () => {}; envelope.add(line);
  }
  for (const u of [0.18, 0.5, 0.79]) {
    const points = Array.from({length: 49}, (_, i) => canopyPoint(u, i / 48));
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), frameMaterial);
    line.raycast = () => {}; envelope.add(line);
  }

  const materials = [bodyMaterial, glassMaterial, frameMaterial];
  root.userData.setShellMode = (mode, value = 0.08) => {
    if (!['solid', 'xray', 'hidden'].includes(mode)) throw new TypeError('Unknown generic shell mode: ' + mode);
    const opacity = Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0.08;
    const solid = mode === 'solid';
    for (const material of materials) {
      const transparent = !solid || material !== bodyMaterial;
      const depthWrite = solid && material === bodyMaterial;
      if (material.transparent !== transparent || material.depthWrite !== depthWrite) material.needsUpdate = true;
      material.transparent = transparent; material.depthWrite = depthWrite;
      material.opacity = solid ? (material === bodyMaterial ? 1 : 0.55) : opacity;
    }
    envelope.visible = mode !== 'hidden';
    for(const material of cabinMaterials)material.opacity=solid?.08:Math.min(.12,opacity*.7);
    envelope.traverse(object => { object.castShadow = solid; object.renderOrder = solid ? 0 : 1; });
    root.userData.shellMode = mode;
    root.userData.opacity = solid ? 1 : mode === 'hidden' ? 0 : opacity;
  };
  root.userData.setShellProgress = (mode, opacity = 0.08) => root.userData.setShellMode(mode, opacity);
  root.userData.setOpacity = opacity => root.userData.setShellMode(opacity >= 1 ? 'solid' : opacity <= 0 ? 'hidden' : 'xray', opacity);
  root.userData.setShellVisible = visible => root.userData.setShellMode(visible ? 'xray' : 'hidden');
  root.userData.setShellMode('xray', 0.08);
  root.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  root.userData.dimensions = {length: size.x, width: size.z, height: size.y, wheelbase: 2.9, bottomY: 0.005};
  root.userData.wheels = wheels;
  root.userData.wheelCenters = wheels.map(wheel => wheel.getWorldPosition(new THREE.Vector3()).toArray());
  root.userData.displayName = sedan ? '通用轿车教学外壳' : '通用 SUV 教学外壳';
  root.userData.bodyType = sedan ? 'sedan' : 'suv';
  root.userData.includesCabin = includeCabin;
  root.userData.cabin = cabin;
  root.userData.includesWheels = true;
  return root;
}
