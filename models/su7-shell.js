// Community SU7 exterior, cabin and wheels. Credits: ./assets/ATTRIBUTION.md.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadSU7Shell() {
  const { scene: model } = await new GLTFLoader().loadAsync(
    new URL('./assets/su7-debadged.glb?v=2', import.meta.url).href
  );
  const shell = new THREE.Group();
  shell.name = 'SU7_debadged_shell';
  model.rotation.y = Math.PI; // Source nose +X → teaching scene nose −X; Y stays up.
  model.scale.setScalar(0.9530695185445427); // Original proportions; wheelbase ≈ 2.90 m.
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.set(-center.x, 0.005 - bounds.min.y, -center.z);
  shell.add(model);

  // The source AO atlas still contains a baked badge footprint after its geometry is removed.
  // A clean clear-coated paint material keeps the original metal/roughness UVs without that AO.
  const finishes = new Map();
  function finish(material) {
    if (finishes.has(material)) return finishes.get(material);
    let result = material;
    if (material.name === 'Car_body') {
      result = new THREE.MeshPhysicalMaterial({
        name: material.name,
        color: '#88a6b4', metalness: 0.62, roughness: 0.28,
        clearcoat: 0.9, clearcoatRoughness: 0.18,
        map: material.map, metalnessMap: material.metalnessMap,
        roughnessMap: material.roughnessMap, normalMap: material.normalMap,
        normalScale: material.normalScale, side: material.side,
        transparent: material.transparent, opacity: material.opacity,
        depthWrite: material.depthWrite, envMapIntensity: 1.12
      });
    } else if (material.name.startsWith('SU7_tire_rubber')) {
      result = material.clone();
      result.metalness = 0;
      result.roughness = 0.96;
      result.metalnessMap = null;
      result.roughnessMap = null;
      result.envMapIntensity = 0.15;
      result.opacity = 1;
      result.transparent = false;
    } else if (material.name === 'M_Wheel_ALL.002' || material.name === 'unbranded_hub') {
      result = material.clone();
      result.roughness = 0.36;
      result.roughnessMap = null;
      result.envMapIntensity = 0.65;
      result.opacity = 1;
      result.transparent = false;
    } else if (material.name === 'Car_window') {
      result = material.clone();
      result.color.set('#24343e');
      result.opacity = 0.68;
      result.transparent = true;
      result.depthWrite = false;
      result.roughness = 0.12;
      result.metalness = 0.06;
      if ('transmission' in result) result.transmission = 0.18;
    }
    finishes.set(material, result);
    return result;
  }
  model.traverse(object => {
    if (!object.isMesh) return;
    object.material = Array.isArray(object.material) ? object.material.map(finish) : finish(object.material);
  });

  const wheelMeshes = new Set();
  model.getObjectByName('Object_56')?.traverse(object => { if (object.isMesh) wheelMeshes.add(object); });
  const originals = new Map();
  shell.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    // This visual shell must never intercept selections of teaching components inside it.
    object.raycast = () => {};
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (originals.has(material)) continue;
      if ('envMapIntensity' in material && !wheelMeshes.has(object)) material.envMapIntensity = 1.12;
      originals.set(material, {
        opacity: material.opacity,
        transparent: material.transparent,
        depthWrite: material.depthWrite,
        transmission: material.transmission,
        emissiveIntensity: material.emissiveIntensity,
        wheel: wheelMeshes.has(object),
        cabin: /^(interior|M_BODY_inside|pasted__M_BODY_inside)/i.test(material.name)
      });
    }
  });

  // Wheels stay visible in every mode; only the imported body/cabin become ghosted or hidden.
  shell.userData.setShellMode = (mode, xrayOpacity = 0.12) => {
    if (!['solid', 'xray', 'hidden'].includes(mode)) throw new TypeError('Unknown SU7 shell mode: ' + mode);
    const opacity = Number.isFinite(xrayOpacity) ? THREE.MathUtils.clamp(xrayOpacity, 0, 1) : 0.12;
    for (const [material, original] of originals) {
      const solid = mode === 'solid' || original.wheel;
      const cabinAlpha = opacity <= 0.1 ? opacity * 0.25 : 0.025 + (opacity - 0.1) * (0.975 / 0.9);
      const alpha = original.cabin ? cabinAlpha : opacity;
      const transparent = solid ? original.transparent : true;
      const transmission = solid ? original.transmission : 0;
      const depthWrite = solid ? original.depthWrite : false;
      const recompile = material.transparent !== transparent || material.depthWrite !== depthWrite ||
        (original.transmission !== undefined && (material.transmission > 0) !== (transmission > 0));
      material.opacity = original.opacity * (solid ? 1 : alpha);
      material.transparent = transparent;
      material.depthWrite = depthWrite;
      if (original.transmission !== undefined) material.transmission = transmission;
      if (original.emissiveIntensity !== undefined) material.emissiveIntensity = original.emissiveIntensity * (solid ? 1 : opacity);
      if (recompile) material.needsUpdate = true;
    }
    shell.traverse(object => {
      if (!object.isMesh) return;
      const wheel = wheelMeshes.has(object);
      object.visible = mode !== 'hidden' || wheel;
      object.castShadow = mode === 'solid' || wheel;
      object.renderOrder = mode === 'xray' && !wheel ? 1 : 0;
    });
    shell.userData.shellMode = mode;
    shell.userData.opacity = mode === 'solid' ? 1 : mode === 'hidden' ? 0 : opacity;
  };
  shell.userData.setShellProgress = (mode, opacity = 0.12) => shell.userData.setShellMode(mode, opacity);
  shell.userData.setOpacity = opacity => shell.userData.setShellMode(
    opacity >= 1 ? 'solid' : opacity <= 0 ? 'hidden' : 'xray', opacity
  );
  shell.userData.setShellVisible = visible => shell.userData.setShellMode(visible ? 'solid' : 'hidden');
  shell.userData.setShellMode('solid');
  shell.userData.dimensions = { length: 4.9914, width: 2.0972, height: 1.3960, wheelbase: 2.9, bottomY: 0.005 };
  shell.updateMatrixWorld(true);
  shell.userData.wheels = ['FL', 'FR', 'RL', 'RR'].map(corner => model.getObjectByName('su7_wheel_' + corner));
  shell.userData.wheelCenters = shell.userData.wheels.map(wheel => wheel.getWorldPosition(new THREE.Vector3()).toArray());
  shell.userData.includesCabin = true;
  shell.userData.includesWheels = true;
  return shell;
}
