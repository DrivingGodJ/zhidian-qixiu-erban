// Batch only static teaching previews. Repair-game meshes retain their individual identities.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function batchStaticAssembly(group) {
  group.updateMatrixWorld(true);
  const batches = new Map();
  group.traverse(mesh => {
    if (!mesh.isMesh || Array.isArray(mesh.material)) return;
    const m = mesh.material;
    const signature = [m.type, m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity,
      m.metalness, m.roughness, m.opacity, m.transparent, m.side, m.depthWrite, m.map?.uuid,
      m.roughnessMap?.uuid, m.normalMap?.uuid, m.normalScale?.toArray().join(','), m.envMapIntensity,
      Object.keys(mesh.geometry.attributes).sort().join(',')].join('/');
    if (!batches.has(signature)) batches.set(signature, { material: m, geometries: [], meshes: [] });
    const batch = batches.get(signature);
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);
    batch.geometries.push(geometry); batch.meshes.push(mesh);
  });
  for (const { material, geometries, meshes } of batches.values()) {
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach(g => g.dispose());
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    // Flatten before adding: a manufacturing detail can itself be a Mesh child.
    meshes.forEach(m => m.removeFromParent());
    group.add(mesh);
  }
  return group;
}
