import * as THREE from 'three';
import { loadTexture } from './realism.js';

const STORAGE_KEY = 'mattis-nest-meubels';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...opts });
}

// Gedeelde houttextuur voor houten meubels (kleur blijft de tint bepalen)
const woodDiff = loadTexture('assets/weathered_planks_diff_1k.jpg', 1, 1, true);
const woodNor = loadTexture('assets/weathered_planks_nor_gl_1k.jpg', 1, 1);

function woodMat(color) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.75, map: woodDiff, normalMap: woodNor,
  });
}

// Alle meubels zijn procedureel en staan met hun voet op y=0.
export const CATALOG = [
  {
    id: 'bed', naam: 'Schelpenbed', emoji: '🛏️',
    build() {
      const g = new THREE.Group();
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        mat(0xff9fbe, { side: THREE.DoubleSide }),
      );
      shell.position.y = 0.85;
      shell.scale.set(1.25, 0.6, 1.25);
      g.add(shell);
      const cushion = new THREE.Mesh(new THREE.SphereGeometry(1.15, 14, 10), mat(0xfff6e8));
      cushion.position.y = 0.45;
      cushion.scale.set(1.15, 0.32, 1.15);
      g.add(cushion);
      return g;
    },
  },
  {
    id: 'lamp', naam: 'Kwallenlamp', emoji: '💡',
    build() {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x8a949a));
      g.add(base);
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.7, 8), mat(0x6b7a80));
      stalk.position.y = 0.95;
      g.add(stalk);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 14, 10),
        mat(0xc9f6ff, { emissive: 0x7fe9ff, emissiveIntensity: 1.3, roughness: 0.3 }),
      );
      bulb.position.y = 2.0;
      bulb.scale.y = 0.85;
      g.add(bulb);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const sliert = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.015, 0.7, 5),
          mat(0xaff0ff, { emissive: 0x7fe9ff, emissiveIntensity: 0.8 }),
        );
        sliert.position.set(Math.cos(a) * 0.3, 1.6, Math.sin(a) * 0.3);
        g.add(sliert);
      }
      return g;
    },
  },
  {
    id: 'tafel', naam: 'Steentafel', emoji: '🪨',
    build() {
      const g = new THREE.Group();
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 0.85, 10), mat(0x7d8a8f, { flatShading: true }));
      leg.position.y = 0.42;
      g.add(leg);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.2, 18), mat(0x9aa7ad));
      top.position.y = 0.95;
      g.add(top);
      return g;
    },
  },
  {
    id: 'krukje', naam: 'Krukje', emoji: '🪑',
    build() {
      const g = new THREE.Group();
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.5, 8), woodMat(0xc89060));
      leg.position.y = 0.25;
      g.add(leg);
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.16, 14), woodMat(0xd8a268));
      seat.position.y = 0.58;
      g.add(seat);
      return g;
    },
  },
  {
    id: 'plant', naam: 'Wierplantje', emoji: '🌿',
    build() {
      const g = new THREE.Group();
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.55, 10), mat(0xe0764f));
      pot.position.y = 0.28;
      g.add(pot);
      for (let i = 0; i < 5; i++) {
        const h = 1.0 + Math.random() * 0.8;
        const blad = new THREE.Mesh(new THREE.ConeGeometry(0.13, h, 5), mat(0x3aa76d, { side: THREE.DoubleSide }));
        blad.position.set((Math.random() - 0.5) * 0.4, 0.55 + h / 2, (Math.random() - 0.5) * 0.4);
        blad.rotation.z = (Math.random() - 0.5) * 0.4;
        g.add(blad);
      }
      return g;
    },
  },
  {
    id: 'schatkist', naam: 'Schatkist', emoji: '💰',
    build() {
      const g = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 0.9), woodMat(0xa87648));
      box.position.y = 0.33;
      g.add(box);
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 1.4, 12, 1, false, 0, Math.PI),
        woodMat(0xc89060),
      );
      lid.rotation.z = Math.PI / 2;
      lid.position.y = 0.66;
      g.add(lid);
      const goud = new THREE.Mesh(
        new THREE.BoxGeometry(1.44, 0.12, 0.94),
        mat(0xffd23f, { emissive: 0xffb703, emissiveIntensity: 0.5, roughness: 0.3 }),
      );
      goud.position.y = 0.62;
      g.add(goud);
      return g;
    },
  },
  {
    id: 'tapijt', naam: 'Tapijtje', emoji: '🟣',
    build() {
      const g = new THREE.Group();
      const groot = new THREE.Mesh(new THREE.CircleGeometry(1.7, 24), mat(0x9d4edd, { roughness: 0.95 }));
      groot.rotation.x = -Math.PI / 2;
      groot.position.y = 0.02;
      g.add(groot);
      const klein = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), mat(0xff70a6, { roughness: 0.95 }));
      klein.rotation.x = -Math.PI / 2;
      klein.position.y = 0.03;
      g.add(klein);
      return g;
    },
  },
  {
    id: 'kast', naam: 'Steenkastje', emoji: '📚',
    build() {
      const g = new THREE.Group();
      const romp = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.1, 0.6), mat(0x8a949a));
      romp.position.y = 1.05;
      g.add(romp);
      for (const y of [0.6, 1.3]) {
        const vak = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 0.5), mat(0x5f6c73));
        vak.position.set(0, y, 0.08);
        g.add(vak);
      }
      const schelpje = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        mat(0xffd7e0),
      );
      schelpje.position.set(0.3, 0.9, 0.25);
      g.add(schelpje);
      return g;
    },
  },
];

const byId = Object.fromEntries(CATALOG.map((c) => [c.id, c]));

// Meubels kiezen, neerzetten (klik op de vloer), draaien (R), weghalen
// (prullenbak-modus) en bewaren in localStorage.
export class FurniturePlacer {
  constructor(scene, camera, dom, { onPlaced, maxRadius = 9.5 } = {}) {
    this.scene = scene;
    this.camera = camera;
    this.maxRadius = maxRadius;
    this.onPlaced = onPlaced;
    this.placed = [];
    this.ghost = null;
    this.ghostId = null;
    this.ghostRot = 0;
    this.deleteMode = false;
    this.enabled = false; // alleen actief in het huisje

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    dom.addEventListener('pointermove', (e) => this.onMove(e));
    dom.addEventListener('pointerdown', (e) => this.onClick(e));
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') this.cancel();
      if (e.code === 'KeyR' && this.ghost) {
        this.ghostRot += Math.PI / 2;
        this.ghost.rotation.y = this.ghostRot;
      }
    });
  }

  get isActive() {
    return this.enabled && (this.ghost !== null || this.deleteMode);
  }

  select(id) {
    this.cancel();
    const item = byId[id];
    if (!item) return;
    this.ghost = item.build();
    this.ghostId = id;
    this.ghostRot = 0;
    this.ghost.traverse((obj) => {
      if (obj.material) {
        obj.material.transparent = true;
        obj.material.opacity = 0.55;
      }
    });
    this.ghost.position.set(0, 0, 4);
    this.scene.add(this.ghost);
  }

  toggleDeleteMode() {
    const next = !this.deleteMode;
    this.cancel();
    this.deleteMode = next;
    return this.deleteMode;
  }

  cancel() {
    if (this.ghost) {
      this.scene.remove(this.ghost);
      this.ghost = null;
      this.ghostId = null;
    }
    this.deleteMode = false;
  }

  floorPoint(e) {
    this.pointer.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.floorPlane, hit)) return null;
    const r = Math.hypot(hit.x, hit.z);
    if (r > this.maxRadius) {
      hit.x *= this.maxRadius / r;
      hit.z *= this.maxRadius / r;
    }
    hit.y = 0;
    return hit;
  }

  onMove(e) {
    if (!this.enabled || !this.ghost) return;
    const p = this.floorPoint(e);
    if (p) this.ghost.position.copy(p);
  }

  onClick(e) {
    if (!this.enabled || e.button !== 0) return;

    if (this.ghost) {
      const p = this.floorPoint(e);
      if (!p) return;
      this.place(this.ghostId, p.x, p.z, this.ghostRot);
      this.scene.remove(this.ghost);
      this.ghost = null;
      this.ghostId = null;
      this.save();
      this.onPlaced?.();
      return;
    }

    if (this.deleteMode) {
      this.pointer.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const meshes = this.placed.map((p) => p.group);
      const hits = this.raycaster.intersectObjects(meshes, true);
      if (hits.length > 0) {
        let root = hits[0].object;
        while (root.parent && !meshes.includes(root)) root = root.parent;
        const idx = this.placed.findIndex((p) => p.group === root);
        if (idx >= 0) {
          this.scene.remove(this.placed[idx].group);
          this.placed.splice(idx, 1);
          this.save();
        }
      }
    }
  }

  place(id, x, z, rot) {
    const item = byId[id];
    if (!item) return;
    const group = item.build();
    group.position.set(x, 0, z);
    group.rotation.y = rot;
    this.scene.add(group);
    this.placed.push({ id, x, z, rot, group });
  }

  save() {
    const data = this.placed.map(({ id, x, z, rot }) => ({ id, x, z, rot }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  loadFromStorage() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      for (const { id, x, z, rot } of data) this.place(id, x, z, rot);
    } catch {
      // ongeldige opslag — gewoon met een lege kamer beginnen
    }
  }
}
