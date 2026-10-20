// Community 2023 XC60 Recharge PHEV visual shell. Credits: ./assets/ATTRIBUTION.md.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadXC60Shell() {
  const { scene: model } = await new GLTFLoader().loadAsync(
    new URL('./assets/xc60-recharge-debadged.glb?v=2', import.meta.url).href
  );
  const shell = new THREE.Group();
  shell.name = 'XC60_Recharge_debadged_shell';
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  model.position.y = 0.005 - bounds.min.y;
  shell.add(model);

  const wheelMeshes = new Set(), wheelMaterials = new Map();
  model.getObjectByName('XC60_wheels').traverse(object => {
    if (!object.isMesh) return;
    wheelMeshes.add(object);
    const wheelMaterial = material => {
      if (!wheelMaterials.has(material)) {
        const clone = material.clone();
        clone.opacity = 1; clone.transparent = false; clone.depthWrite = true;
        clone.envMapIntensity = material.name === 'XC60_rubber' ? 0.15 : 0.65;
        wheelMaterials.set(material, clone);
      }
      return wheelMaterials.get(material);
    };
    object.material = Array.isArray(object.material) ? object.material.map(wheelMaterial) : wheelMaterial(object.material);
  });
  const originals = new Map();
  shell.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = object.receiveShadow = true;
    object.raycast = () => {}; // Preserve picking of the independent teaching assemblies.
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (originals.has(material)) continue;
      if (!wheelMeshes.has(object)) material.envMapIntensity = 1.05;
      if (material.name === 'XC60_glass') material.depthWrite = false;
      originals.set(material, {
        opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite,
        transmission: material.transmission, emissiveIntensity: material.emissiveIntensity,
        metalness: material.metalness, roughness: material.roughness,
        clearcoat: material.clearcoat, envMapIntensity: material.envMapIntensity,
        wheel: wheelMeshes.has(object), cabin: material.name === 'XC60_cabin'
      });
    }
  });
  shell.userData.setShellMode = (mode, value = 0.12) => {
    if (!['solid', 'xray', 'hidden'].includes(mode)) throw new TypeError('Unknown XC60 shell mode: ' + mode);
    const opacity = Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0.12;
    for (const [material, original] of originals) {
      const solid = mode === 'solid' || original.wheel;
      const transparent = solid ? original.transparent : true;
      const depthWrite = solid ? original.depthWrite : false;
      const transmission = solid ? original.transmission : 0;
      const clearcoat = solid ? original.clearcoat : 0;
      const recompile = material.transparent !== transparent || material.depthWrite !== depthWrite ||
        (original.transmission !== undefined && (material.transmission > 0) !== (transmission > 0)) ||
        (original.clearcoat !== undefined && (material.clearcoat > 0) !== (clearcoat > 0));
      // Uniform shell opacity keeps door fittings and glazing from obscuring
      // teaching parts; the complete cabin is omitted in transparent views.
      material.opacity = solid ? original.opacity : original.cabin ? 0 : opacity;
      material.transparent = transparent; material.depthWrite = depthWrite;
      if (original.transmission !== undefined) material.transmission = transmission;
      if (original.clearcoat !== undefined) material.clearcoat = clearcoat;
      material.metalness = solid ? original.metalness : 0;
      material.roughness = solid ? original.roughness : 0.72;
      material.envMapIntensity = solid ? original.envMapIntensity : 0.2;
      if (original.emissiveIntensity !== undefined) material.emissiveIntensity = original.emissiveIntensity * (solid ? 1 : opacity);
      if (recompile) material.needsUpdate = true;
    }
    shell.traverse(object => {
      if (!object.isMesh) return;
      const wheel = wheelMeshes.has(object);
      const cabin = !wheel && (Array.isArray(object.material) ? object.material : [object.material])
        .every(material => originals.get(material).cabin);
      object.visible = wheel || (mode !== 'hidden' && !(mode === 'xray' && cabin));
      object.castShadow = mode === 'solid' || wheel;
      object.renderOrder = mode === 'xray' && !wheel ? 1 : 0;
    });
    shell.userData.shellMode = mode;
    shell.userData.opacity = mode === 'solid' ? 1 : mode === 'hidden' ? 0 : opacity;
  };
  shell.userData.setShellProgress = (mode, opacity = 0.12) => shell.userData.setShellMode(mode, opacity);
  shell.userData.setOpacity = opacity => shell.userData.setShellMode(opacity >= 1 ? 'solid' : opacity <= 0 ? 'hidden' : 'xray', opacity);
  shell.userData.setShellVisible = visible => shell.userData.setShellMode(visible ? 'solid' : 'hidden');
  shell.userData.setShellMode('solid');
  shell.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(shell).getSize(new THREE.Vector3());
  shell.userData.dimensions = { length: size.x, width: size.z, height: size.y, wheelbase: 2.9, bottomY: 0.005 };
  shell.userData.wheels = ['FL', 'FR', 'RL', 'RR'].map(corner => model.getObjectByName('XC60_wheel_' + corner));
  shell.userData.wheelCenters = shell.userData.wheels.map(wheel => wheel.getWorldPosition(new THREE.Vector3()).toArray());
  shell.userData.teachingScale = 1.0104831887024472;
  shell.userData.displayName = 'XC60 Recharge 去标 SUV';
  shell.userData.powertrain = 'phev';
  shell.userData.includesCabin = shell.userData.includesWheels = true;
  return shell;
}
