import * as THREE from 'three';
import { groundHeight, makeDotTexture } from './environment.js';

const BUILD_TIME = 2.5;

function easeOutBack(t) {
  const c = 1.70158;
  const x = t - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
}

// Een kogelvis-nest: zandkuil met opstaande rand, versierd met schelpen
// en steentjes. Eén nest tegelijk; opnieuw bouwen verplaatst het.
export class Nest {
  constructor(scene, onReady) {
    this.scene = scene;
    this.onReady = onReady;
    this.group = null;
    this.progress = 1;
    this.ready = false;
    this.center = new THREE.Vector3();
    this.decorations = [];
    this.sandCloud = null;
  }

  get isReady() {
    return this.ready;
  }

  get isBuilding() {
    return this.group !== null && this.progress < 1;
  }

  get position() {
    return this.center;
  }

  buildAt(x, z) {
    this.remove();

    const y = groundHeight(x, z);
    this.center.set(x, y + 1, z);
    this.group = new THREE.Group();
    this.group.position.set(x, y, z);
    this.progress = 0;
    this.ready = false;

    // Kuil met opstaande rand (doorsnede van binnen naar buiten).
    // De bodem ligt ruim boven het zandvlak, anders prikt dat erdoorheen.
    const profile = [
      [0.0, 0.35], [1.2, 0.32], [2.0, 0.45], [2.6, 0.85],
      [3.0, 1.25], [3.5, 1.2], [4.1, 0.5], [4.6, -0.7],
    ].map(([r, h]) => new THREE.Vector2(r, h));
    const crater = new THREE.Mesh(
      new THREE.LatheGeometry(profile, 28),
      new THREE.MeshStandardMaterial({ color: 0xb0954f, roughness: 1, side: THREE.DoubleSide }),
    );
    this.group.add(crater);

    // Schelpen en steentjes op de rand — groot en fleurig zodat ze opvallen
    const shellMats = [0xffffff, 0xff8fb3, 0xffb36b].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }),
    );
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5f6c73, roughness: 0.95, flatShading: true });
    const shellGeo = new THREE.SphereGeometry(0.55, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const stoneGeo = new THREE.DodecahedronGeometry(0.42, 0);

    this.decorations = [];
    const count = 13;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const isShell = i % 2 === 0;
      const mesh = new THREE.Mesh(
        isShell ? shellGeo : stoneGeo,
        isShell ? shellMats[(i / 2) % shellMats.length | 0] : stoneMat,
      );
      mesh.position.set(Math.cos(angle) * 3.2, 1.3, Math.sin(angle) * 3.2);
      mesh.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI, (Math.random() - 0.5) * 0.5);
      if (isShell) mesh.scale.set(1, 0.65, 1.15);
      mesh.userData.popAt = 0.25 + (i / count) * 0.6; // ploppen één voor één
      mesh.scale.multiplyScalar(0.001);
      mesh.userData.baseScale = isShell ? new THREE.Vector3(1, 0.65, 1.15) : new THREE.Vector3(1, 1, 1);
      this.group.add(mesh);
      this.decorations.push(mesh);
    }

    // Opwervelende zandwolk tijdens het graven
    const n = 60;
    const positions = new Float32Array(n * 3);
    this.cloudVel = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 3;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.3;
      positions[i * 3 + 2] = Math.sin(a) * r;
      this.cloudVel.push(new THREE.Vector3(
        Math.cos(a) * (0.5 + Math.random()), 1.5 + Math.random() * 2, Math.sin(a) * (0.5 + Math.random()),
      ));
    }
    const cloudGeo = new THREE.BufferGeometry();
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.sandCloud = new THREE.Points(cloudGeo, new THREE.PointsMaterial({
      color: 0xd9c27e, size: 0.5, map: makeDotTexture(true),
      transparent: true, opacity: 0.9, depthWrite: false,
    }));
    this.group.add(this.sandCloud);

    this.group.scale.setScalar(0.15);
    this.scene.add(this.group);
  }

  remove() {
    if (!this.group) return;
    this.scene.remove(this.group);
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
    });
    this.group = null;
    this.ready = false;
  }

  update(dt) {
    if (!this.group || this.ready) return;

    this.progress = Math.min(1, this.progress + dt / BUILD_TIME);
    const p = this.progress;

    // Kuil groeit
    this.group.scale.setScalar(0.15 + 0.85 * Math.min(1, easeOutBack(Math.min(p / 0.6, 1))));

    // Schelpen en steentjes ploppen tevoorschijn
    for (const deco of this.decorations) {
      const t = THREE.MathUtils.clamp((p - deco.userData.popAt) / 0.2, 0, 1);
      if (t > 0) {
        const s = easeOutBack(t);
        deco.scale.copy(deco.userData.baseScale).multiplyScalar(Math.max(s, 0.001));
      }
    }

    // Zandwolk stijgt op en vervaagt
    if (this.sandCloud) {
      const pos = this.sandCloud.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const v = this.cloudVel[i];
        pos.setXYZ(i, pos.getX(i) + v.x * dt, pos.getY(i) + v.y * dt, pos.getZ(i) + v.z * dt);
      }
      pos.needsUpdate = true;
      this.sandCloud.material.opacity = 0.9 * (1 - p);
      if (p >= 1) {
        this.group.remove(this.sandCloud);
        this.sandCloud.geometry.dispose();
        this.sandCloud = null;
      }
    }

    if (p >= 1) {
      this.ready = true;
      this.onReady?.();
    }
  }
}
