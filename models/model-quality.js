// Shared, deterministic manufacturing details for the teaching models.
import * as THREE from 'three';

export function roundedBox(width, height, depth, radius = Math.min(width, height, depth) * .18) {
  const geometry = new THREE.BoxGeometry(width, height, depth, 5, 5, 5);
  const position = geometry.attributes.position, normal = geometry.attributes.normal;
  const half = new THREE.Vector3(width / 2, height / 2, depth / 2);
  const r = Math.min(radius, Math.min(width, height, depth) * .48);
  const v = new THREE.Vector3(), core = new THREE.Vector3(), direction = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    // Put the existing samples on the fillet instead of spending them across
    // flat panels. Two curved edge segments retain the same 300-triangle cost.
    for (const axis of ['x','y','z']) {
      const edge = half[axis], index = Math.round((v[axis] / edge + 1) * 2.5);
      v[axis] = [-edge,-edge+r*(1-Math.SQRT1_2),-edge+r,edge-r,edge-r*(1-Math.SQRT1_2),edge][index];
    }
    core.set(...['x', 'y', 'z'].map(axis => THREE.MathUtils.clamp(v[axis], -half[axis] + r, half[axis] - r)));
    direction.subVectors(v, core).normalize();
    v.copy(core).addScaledVector(direction, r);
    position.setXYZ(i, v.x, v.y, v.z);
    normal.setXYZ(i, direction.x, direction.y, direction.z);
  }
  position.needsUpdate = normal.needsUpdate = true;
  geometry.computeBoundingSphere();
  geometry.userData.manufactured = true;
  return geometry;
}

export function qualityGeometry(source) {
  const p = source.parameters;
  if (!p || source.userData?.manufactured) return source;
  let geometry;
  if (source.type === 'BoxGeometry') geometry = roundedBox(p.width, p.height, p.depth);
  else if (source.type === 'CylinderGeometry') {
    // Keep intentional hexagonal nuts and open cutaway housings intact.
    if (p.radialSegments <= 8) return source;
    const segments = Math.max(48, p.radialSegments), r = Math.min(p.radiusTop, p.radiusBottom);
    const b = Math.min(r * .09, p.height * .14);
    if (p.openEnded || !r || p.thetaLength < Math.PI * 1.99) {
      geometry = new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, segments, p.heightSegments, p.openEnded, p.thetaStart, p.thetaLength);
    } else {
      geometry = new THREE.LatheGeometry([
        new THREE.Vector2(0, -p.height / 2),
        new THREE.Vector2(Math.max(0, p.radiusBottom - b), -p.height / 2),
        new THREE.Vector2(p.radiusBottom, -p.height / 2 + b),
        new THREE.Vector2(p.radiusTop, p.height / 2 - b),
        new THREE.Vector2(Math.max(0, p.radiusTop - b), p.height / 2),
        new THREE.Vector2(0, p.height / 2)
      ], segments);
    }
  } else if (source.type === 'TorusGeometry') {
    const thin = p.tube / p.radius < .1;
    geometry = new THREE.TorusGeometry(p.radius, p.tube, thin ? 8 : 12, p.radius > .2 ? 64 : 48, p.arc);
  } else if (source.type === 'SphereGeometry') {
    geometry = new THREE.SphereGeometry(p.radius, Math.max(40, p.widthSegments), Math.max(28, p.heightSegments), p.phiStart, p.phiLength, p.thetaStart, p.thetaLength);
  } else if (source.type === 'CapsuleGeometry') {
    geometry = new THREE.CapsuleGeometry(p.radius, p.height ?? p.length, Math.max(10, p.capSegments), Math.max(32, p.radialSegments));
  } else if (source.type === 'TubeGeometry') {
    geometry = new THREE.TubeGeometry(p.path, Math.max(36, p.tubularSegments), p.radius, Math.max(12, p.radialSegments), p.closed);
  }
  if (!geometry) return source;
  // Some original repair steps inspect these fields to find the replaceable part.
  geometry.type = source.type;
  geometry.parameters = { ...p };
  geometry.userData.manufactured = true;
  source.dispose();
  return geometry;
}

let metalSurfaceMaps;
function surfaceMaps() {
  if (metalSurfaceMaps) return metalSurfaceMaps;
  const size = 128, roughness = new Uint8Array(size * size * 4), normal = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const hash = Math.sin(x * 127.1 + y * 311.7) * 43758.5453, grain = hash - Math.floor(hash), i = (y * size + x) * 4;
    roughness.set([220 + Math.floor(grain * 35), 220 + Math.floor(grain * 35), 220 + Math.floor(grain * 35), 255], i);
    normal.set([128 + Math.round((grain - .5) * 8), 128 + Math.round(Math.sin(y * .34) * 4), 255, 255], i);
  }
  const texture = data => {
    const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
    t.repeat.set(3, 3); t.userData.sharedFinish = true; t.needsUpdate = true;
    return t;
  };
  metalSurfaceMaps = { roughness: texture(roughness), normal: texture(normal) };
  return metalSurfaceMaps;
}

export function finishMaterial(material) {
  if (!material?.isMeshStandardMaterial || material.transparent || material.metalness < .45 || (material.emissive?.getHex() && material.emissiveIntensity > .1)) return material;
  const maps = surfaceMaps();
  // Fine machining grain stays subtle under the dark studio's large softboxes.
  if (!material.roughnessMap) material.roughnessMap = maps.roughness;
  if (!material.normalMap) { material.normalMap = maps.normal; material.normalScale.set(.12, .12); }
  return material;
}

export function finishPalette() {
  const metal = (color, metalness, roughness) => finishMaterial(new THREE.MeshStandardMaterial({ color, metalness, roughness }));
  return {
    aluminum: metal(0xa3afb6, .68, .42), steel: metal(0x66717d, .78, .38),
    rubber: metal(0x161c23, .02, .82), copper: metal(0xb97b4e, .8, .34),
    ceramic: metal(0xe7e9e6, .08, .38), orange: metal(0xed7836, .12, .42)
  };
}

function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  m.userData.manufacturingDetail = true;
  parent.add(m); return m;
}

export function fastener(parent, x, y, z, size, material, axis = 'y') {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  if (axis === 'x') g.rotation.z = Math.PI / 2;
  if (axis === 'z') g.rotation.x = Math.PI / 2;
  mesh(g, new THREE.CylinderGeometry(size * 1.23, size * 1.23, size * .15, 24), material);
  mesh(g, new THREE.CylinderGeometry(size, size, size * .54, 6), material, 0, size * .27, 0);
  mesh(g, new THREE.CylinderGeometry(size * .39, size * .39, size * .06, 6), new THREE.MeshStandardMaterial({ color: 0x18212a, metalness: .3, roughness: .65 }), 0, size * .57, 0);
  return g;
}

export function cable(parent, points, radius, material) {
  return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 40, radius, 12), material);
}

export function connector(parent, p, radius, length, material, axis = 'y') {
  const g = new THREE.Group(); g.position.set(...p); parent.add(g);
  if (axis === 'x') g.rotation.z = Math.PI / 2;
  if (axis === 'z') g.rotation.x = Math.PI / 2;
  const rubber = new THREE.MeshStandardMaterial({ color: 0x161c23, metalness: .02, roughness: .8 });
  mesh(g, qualityGeometry(new THREE.CylinderGeometry(radius, radius, length, 32)), material);
  for (const y of [-length * .33, length * .33]) {
    const collar = mesh(g, new THREE.TorusGeometry(radius, radius * .13, 12, 40), rubber, 0, y, 0);
    collar.rotation.x = Math.PI / 2;
  }
  mesh(g, new THREE.CylinderGeometry(radius * .62, radius * .62, length * .05, 32), rubber, 0, length * .51, 0);
  // A keyed latch and recessed contacts distinguish a connector from a pipe.
  mesh(g, roundedBox(radius*.25,length*.32,radius*.3), rubber, radius*.98,0,0);
  const tint=material.color?.getHSL({});
  // This helper also makes coolant/hydrogen couplings; only electrical orange
  // connectors receive conductors. Fluid fittings retain a recessed dark bore.
  if(tint&&tint.s>.5&&tint.h>.025&&tint.h<.13){
    const contact = new THREE.MeshStandardMaterial({color:0xb97b4e,metalness:.8,roughness:.34});
    for(let i=0;i<3;i++) {
      const a=i*Math.PI*2/3;
      mesh(g,new THREE.CylinderGeometry(radius*.12,radius*.12,length*.004,16),contact,Math.cos(a)*radius*.32,length*.533,Math.sin(a)*radius*.32);
    }
  }
  return g;
}

export function refineAssembly(root) {
  const palette = finishPalette(), sources = [];
  root.traverse(o => { if (o.isMesh && !o.userData.manufacturingDetail && !o.userData.manufacturingRefined) sources.push(o); });
  for (const m of sources) {
    m.userData.manufacturingRefined = true;
    m.geometry = qualityGeometry(m.geometry);
    m.castShadow = m.receiveShadow = true;
    const p = m.geometry.parameters, mat = m.material;
    if (!p || Array.isArray(mat) || mat.transparent || mat.isMeshBasicMaterial) continue;
    finishMaterial(mat);
    if (m.geometry.type === 'BoxGeometry') {
      const { width: w, height: h, depth: d } = p;
      // Actual casings receive a lid seam and captive fasteners; thin circuit cells remain readable.
      if (w < .18 || d < .14 || h < .045 || w * h * d < .002) continue;
      const r = Math.min(w, d) * .035, top = h / 2;
      for (const x of [-1, 1]) for (const z of [-1, 1]) fastener(m, x * (w / 2 - r * 2.5), top + .001, z * (d / 2 - r * 2.5), r, palette.steel);
      const seam = Math.min(.005, h * .025);
      for (const side of [-1, 1]) {
        mesh(m, roundedBox(w * .94, seam, seam), palette.rubber, 0, h * .34, side * (d / 2 + .0005));
        mesh(m, roundedBox(seam, seam, d * .94), palette.rubber, side * (w / 2 + .0005), h * .34, 0);
      }
      if (h > .09 && w > .25) {
        for (const x of [-1, 1]) mesh(m, roundedBox(w * .11, h * .17, d * .18), palette.aluminum, x * w * .43, -h * .44, 0);
      }
    } else if (m.geometry.type === 'CylinderGeometry' && p.radialSegments > 8 && !p.openEnded && p.radiusTop > .065) {
      const r = Math.max(p.radiusTop, p.radiusBottom), h = p.height;
      if (h < r * .19) continue;
      for (const y of [-1, 1]) {
        const ring = mesh(m, new THREE.TorusGeometry(r * .986, Math.min(r * .018, h * .045), 10, 48), palette.steel, 0, y * h * .38, 0);
        ring.rotation.x = Math.PI / 2;
      }
      if (r > .085 && h > .08) for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        fastener(m, Math.cos(a) * r * .76, h / 2 + .001, Math.sin(a) * r * .76, r * .055, palette.steel);
      }
    }
  }
  return root;
}

export function studioEnvironment(renderer) {
  // Procedural softboxes give metals real reflections without an external HDR download.
  const w = 128, h = 64, data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const horizon = Math.exp(-(((y - h * .48) / (h * .24)) ** 2));
    const softbox = ((x > 9 && x < 25) || (x > 65 && x < 79) || (x > 105 && x < 115)) && y > 8 && y < 30;
    const v = softbox ? 240 : 28 + horizon * 65, i = (y * w + x) * 4;
    data[i] = v; data[i + 1] = v * .98; data[i + 2] = v * .96; data[i + 3] = 255;
  }
  const source = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  source.mapping = THREE.EquirectangularReflectionMapping; source.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer), result = pmrem.fromEquirectangular(source);
  source.dispose(); pmrem.dispose();
  return result.texture;
}

export function disposeAssembly(root, sharedMaterials = []) {
  const keep = new Set(sharedMaterials), geometries = new Set(), materials = new Set(), textures = new Set();
  root.traverse(o => {
    if (o.geometry) geometries.add(o.geometry);
    for (const material of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!material || keep.has(material)) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture && !value.userData.sharedFinish) textures.add(value);
    }
  });
  geometries.forEach(g => g.dispose());
  textures.forEach(t => t.dispose());
  materials.forEach(m => m.dispose());
}
