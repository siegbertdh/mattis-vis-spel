import * as THREE from 'three';

// Kwaliteitstrap: gsm/tablet = 'laag' (geen schaduwen/bloom), computer = 'hoog'.
// Te forceren met ?q=laag of ?q=hoog voor testen.
const qParam = new URLSearchParams(location.search).get('q');
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
export const QUALITY = qParam === 'laag' ? 'laag' : qParam === 'hoog' ? 'hoog' : (isTouch ? 'laag' : 'hoog');

const loader = new THREE.TextureLoader();

export function loadTexture(url, repeatX = 1, repeatY = 1, srgb = false) {
  const tex = loader.load(url);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 4;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Tileable caustics-patroon (heldere celranden, zoals zonlicht door golven).
// Voronoi: helder waar twee celpunten even ver weg zijn.
export function createCausticsTexture(size = 256, cells = 20) {
  const pts = Array.from({ length: cells }, () => [Math.random() * size, Math.random() * size]);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let d1 = 1e9;
      let d2 = 1e9;
      for (const [px, py] of pts) {
        let dx = Math.abs(x - px);
        if (dx > size / 2) dx = size - dx; // torus-afstand = naadloos tegelbaar
        let dy = Math.abs(y - py);
        if (dy > size / 2) dy = size - dy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
      }
      const v = Math.pow(Math.max(0, 1 - (d2 - d1) / 11), 2.4);
      const i = (y * size + x) * 4;
      const b = Math.min(255, v * 360);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Tileable normal map van golfjes (som van sinusgolven, analytische gradient)
export function createWaterNormalsTexture(size = 256) {
  const TAU = Math.PI * 2;
  const waves = Array.from({ length: 7 }, (_, i) => ({
    fx: (TAU / size) * (1 + Math.floor(Math.random() * 4)),
    fy: (TAU / size) * (1 + Math.floor(Math.random() * 4)),
    ph: Math.random() * TAU,
    amp: 6 / (i + 1.5),
  }));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let dhdx = 0;
      let dhdy = 0;
      for (const w of waves) {
        const c = Math.cos(w.fx * x + w.fy * y + w.ph) * w.amp;
        dhdx += c * w.fx;
        dhdy += c * w.fy;
      }
      const n = new THREE.Vector3(-dhdx, -dhdy, 1).normalize();
      const i = (y * size + x) * 4;
      img.data[i] = (n.x * 0.5 + 0.5) * 255;
      img.data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      img.data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Environment map voor realistische reflecties: een gradientbol + felle "zon",
// via PMREM. topHex = boven, botHex = onder.
export function createEnvMap(renderer, topHex, midHex, botHex, sunHex = null) {
  const scene = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 32, 16);
  const top = new THREE.Color(topHex);
  const mid = new THREE.Color(midHex);
  const bot = new THREE.Color(botHex);
  const pos = geo.attributes.position;
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) / 10 + 1) / 2;
    const c = t > 0.5 ? mid.clone().lerp(top, (t - 0.5) * 2) : bot.clone().lerp(mid, t * 2);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  if (sunHex) {
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 8), new THREE.MeshBasicMaterial({ color: sunHex }));
    sun.position.set(3, 7.5, 2);
    scene.add(sun);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.08).texture;
  pmrem.dispose();
  return env;
}

// Natuurlijke rotsvorm: icosahedron met radiale ruis per vertex
export function createRockGeometry(detail = 2, roughness = 0.3) {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    const n = 1 + roughness * (
      Math.sin(v.x * 3.1 + v.y * 5.3) * 0.5
      + Math.sin(v.y * 4.7 + v.z * 3.9) * 0.3
      + Math.sin(v.z * 6.1 + v.x * 2.3) * 0.2
    );
    v.multiplyScalar(n);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  // identieke hoekpunten weer samenvoegen kan niet zonder mergeVertices;
  // de ruisfunctie is continu, dus de randen sluiten vanzelf aan
  geo.computeVertexNormals();
  return geo;
}
