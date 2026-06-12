import * as THREE from 'three';
import { makeDotTexture } from './environment.js';
import { loadTexture } from './realism.js';

// Het holletje in het nest: een warme koepelkamer onder het zand.
export const HOME_BOUNDS = { radius: 10.5, minY: 1, maxY: 8.5 };

export function createHomeScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x5c4630);
  scene.fog = new THREE.Fog(0x5c4630, 18, 42);

  scene.add(new THREE.AmbientLight(0xffe0b3, 0.55));
  scene.add(new THREE.HemisphereLight(0xffe9c4, 0x3d2c1a, 0.5));
  const lamp = new THREE.PointLight(0xffd9a0, 120, 60);
  lamp.position.set(0, 8, 0);
  scene.add(lamp);

  // Vloer
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(13, 48),
    new THREE.MeshStandardMaterial({
      color: 0xe8d49a, roughness: 0.95,
      map: loadTexture('assets/sand_01_diff_1k.jpg', 5, 5, true),
      normalMap: loadTexture('assets/sand_01_nor_gl_1k.jpg', 5, 5),
      normalScale: new THREE.Vector2(0.8, 0.8),
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Koepelwand
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(13.1, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0xe0c49c, roughness: 0.95, side: THREE.BackSide,
      map: loadTexture('assets/rock_boulder_dry_diff_1k.jpg', 7, 3, true),
      normalMap: loadTexture('assets/rock_boulder_dry_nor_gl_1k.jpg', 7, 3),
    }),
  );
  scene.add(dome);

  // Raampjes: gloeiende blauwe rondjes op de wand
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const window_ = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 20),
      new THREE.MeshBasicMaterial({ color: 0x7fd8ff }),
    );
    const wx = Math.cos(a) * 12.2;
    const wz = Math.sin(a) * 12.2;
    window_.position.set(wx, 5, wz);
    window_.lookAt(0, 4, 0);
    scene.add(window_);
  }

  // Het deurtje terug naar de oceaan: houten boog met gloeiend waterportaal
  const doorPos = new THREE.Vector3(0, 1.8, 12.3);
  const wood = new THREE.MeshStandardMaterial({
    color: 0xb5824f, roughness: 0.8,
    map: loadTexture('assets/weathered_planks_diff_1k.jpg', 1, 1, true),
    normalMap: loadTexture('assets/weathered_planks_nor_gl_1k.jpg', 1, 1),
  });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.35, 8, 16, Math.PI), wood);
  arch.position.set(0, 2.1, 12.3);
  arch.rotation.y = Math.PI; // opening naar de kamer
  scene.add(arch);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 2.2, 8), wood);
    post.position.set(side * 2.1, 1.1, 12.3);
    scene.add(post);
  }
  const portal = new THREE.Mesh(
    new THREE.CircleGeometry(1.9, 24),
    new THREE.MeshBasicMaterial({ color: 0x4dc3ff, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
  );
  portal.position.set(0, 2.0, 12.25);
  portal.rotation.y = Math.PI;
  scene.add(portal);

  // Bordje "Oceaan" boven de deur? Houden we simpel: een schelpje erboven
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xfff1e6, roughness: 0.5 }),
  );
  shell.position.set(0, 4.5, 12.2);
  shell.scale.set(1, 0.7, 1.1);
  scene.add(shell);

  // Bubbeltjes in de kamer
  const n = 40;
  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 11;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = Math.random() * 9;
    positions[i * 3 + 2] = Math.sin(a) * r;
  }
  const bubbleGeo = new THREE.BufferGeometry();
  bubbleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const bubbles = new THREE.Points(bubbleGeo, new THREE.PointsMaterial({
    size: 0.35, map: makeDotTexture(), transparent: true, opacity: 0.5, depthWrite: false,
  }));
  scene.add(bubbles);

  function update(dt, time) {
    const pos = bubbles.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + dt * 1.2;
      if (y > 10) y = 0.3;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    portal.material.opacity = 0.75 + Math.sin(time * 2.2) * 0.15;
  }

  return { scene, doorPos, update };
}
