import * as THREE from 'three';

const WORLD = 150;

// Middelpunt van het koraalrif met de grote rotsen
export const REEF_CENTER = new THREE.Vector3(70, 0, -60);

export function groundHeight(x, z) {
  return Math.sin(x * 0.05) * Math.cos(z * 0.07) * 1.5
       + Math.sin(x * 0.013 + z * 0.021) * 1.2;
}

function randomSpot(minR = 8) {
  const angle = Math.random() * Math.PI * 2;
  const r = minR + Math.random() * (WORLD - 15 - minR);
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

// Rond bolletjes-sprite voor bubbels, plankton en zandwolkjes
export function makeDotTexture(soft = false) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(soft ? 0.4 : 0.7, 'rgba(200,235,255,0.45)');
  g.addColorStop(1, 'rgba(200,235,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.seaweed = [];
    this.rays = [];

    // Water: blauwe achtergrond + mist voor diepte
    scene.background = new THREE.Color(0x2b7fb5);
    scene.fog = new THREE.Fog(0x2b7fb5, 25, 130);

    // Licht
    scene.add(new THREE.HemisphereLight(0xa8dcff, 0x1c4a5e, 1.0));
    this.sun = new THREE.DirectionalLight(0xd8f0ff, 1.6);
    this.sun.position.set(30, 90, 20);
    scene.add(this.sun);

    this.buildSand();
    this.buildSeaweed();
    this.buildCorals();
    this.buildRocksAndShells();
    this.buildReef();
    this.buildBubbles();
    this.buildPlankton();
    this.buildLightRays();
  }

  buildSand() {
    const geo = new THREE.PlaneGeometry(WORLD * 3, WORLD * 3, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, groundHeight(pos.getX(i), pos.getZ(i)));
    }
    geo.computeVertexNormals();
    const sand = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xd9c27e, roughness: 1 }));
    this.scene.add(sand);
  }

  buildSeaweed() {
    const greens = [0x2e8b57, 0x3aa76d, 0x1f6e43].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, side: THREE.DoubleSide }),
    );
    const bladeGeos = [3.5, 5, 7].map((h) => {
      const g = new THREE.ConeGeometry(0.22, h, 5);
      g.translate(0, h / 2, 0); // voet op de bodem
      return g;
    });

    for (let clump = 0; clump < 55; clump++) {
      const [cx, cz] = randomSpot();
      const blades = 3 + Math.floor(Math.random() * 4);
      for (let b = 0; b < blades; b++) {
        const x = cx + (Math.random() - 0.5) * 2.5;
        const z = cz + (Math.random() - 0.5) * 2.5;
        const mesh = new THREE.Mesh(
          bladeGeos[Math.floor(Math.random() * bladeGeos.length)],
          greens[Math.floor(Math.random() * greens.length)],
        );
        mesh.position.set(x, groundHeight(x, z) - 0.2, z);
        mesh.scale.setScalar(0.7 + Math.random() * 0.7);
        this.scene.add(mesh);
        this.seaweed.push({
          mesh,
          phase: Math.random() * Math.PI * 2,
          lean: (Math.random() - 0.5) * 0.15,
          amp: 0.08 + Math.random() * 0.08,
        });
      }
    }
  }

  buildCorals() {
    const colors = [0xff6f91, 0xff9671, 0xc77dff, 0xffc75f].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }),
    );
    const bulbGeo = new THREE.SphereGeometry(0.6, 10, 8);
    const branchGeo = new THREE.ConeGeometry(0.35, 1.6, 6);

    for (let i = 0; i < 35; i++) {
      const [cx, cz] = randomSpot();
      const cy = groundHeight(cx, cz);
      const mat = colors[Math.floor(Math.random() * colors.length)];
      const cluster = new THREE.Group();
      const parts = 3 + Math.floor(Math.random() * 4);
      for (let p = 0; p < parts; p++) {
        const part = new THREE.Mesh(Math.random() < 0.5 ? bulbGeo : branchGeo, mat);
        part.position.set((Math.random() - 0.5) * 1.6, Math.random() * 0.9, (Math.random() - 0.5) * 1.6);
        part.rotation.set((Math.random() - 0.5) * 0.6, Math.random() * Math.PI, (Math.random() - 0.5) * 0.6);
        part.scale.setScalar(0.6 + Math.random() * 0.9);
        cluster.add(part);
      }
      cluster.position.set(cx, cy, cz);
      this.scene.add(cluster);
    }
  }

  buildRocksAndShells() {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x7d8a8f, roughness: 0.95, flatShading: true });
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    for (let i = 0; i < 28; i++) {
      const [x, z] = randomSpot();
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(x, groundHeight(x, z) + 0.2, z);
      rock.scale.set(0.6 + Math.random() * 2.2, 0.5 + Math.random() * 1.2, 0.6 + Math.random() * 2.2);
      rock.rotation.y = Math.random() * Math.PI;
      this.scene.add(rock);
    }

    const shellMats = [0xfff1e6, 0xffd7e0].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }),
    );
    const shellGeo = new THREE.SphereGeometry(0.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    for (let i = 0; i < 25; i++) {
      const [x, z] = randomSpot();
      const shell = new THREE.Mesh(shellGeo, shellMats[i % 2]);
      shell.position.set(x, groundHeight(x, z) + 0.05, z);
      shell.scale.set(1, 0.6, 1.2);
      shell.rotation.y = Math.random() * Math.PI;
      this.scene.add(shell);
    }
  }

  // Het koraalrif: grote donkere rotsen begroeid met fel en gloeiend koraal
  buildReef() {
    const rockMats = [0x3a4750, 0x33405e].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true }),
    );
    const rockGeo = new THREE.DodecahedronGeometry(1, 1);
    const coralMats = [0xff4d8d, 0xff8c42, 0xb14aed, 0x3a86ff, 0x35d07f].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, emissive: c, emissiveIntensity: 0.25 }),
    );
    const bulbGeo = new THREE.SphereGeometry(0.6, 10, 8);
    const branchGeo = new THREE.ConeGeometry(0.32, 1.8, 6);

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
      const r = i === 0 ? 0 : 6 + Math.random() * 14;
      const x = REEF_CENTER.x + Math.cos(a) * r;
      const z = REEF_CENTER.z + Math.sin(a) * r;
      const sx = 4 + Math.random() * 4;
      const sy = 2.5 + Math.random() * 3;

      const rock = new THREE.Mesh(rockGeo, rockMats[i % 2]);
      rock.position.set(x, groundHeight(x, z) + sy * 0.25, z);
      rock.scale.set(sx, sy, 4 + Math.random() * 4);
      rock.rotation.y = Math.random() * Math.PI;
      this.scene.add(rock);

      // Koralen bovenop de rots
      const coralCount = 3 + Math.floor(Math.random() * 3);
      for (let c = 0; c < coralCount; c++) {
        const cluster = new THREE.Group();
        const mat = coralMats[Math.floor(Math.random() * coralMats.length)];
        const parts = 2 + Math.floor(Math.random() * 3);
        for (let p = 0; p < parts; p++) {
          const part = new THREE.Mesh(Math.random() < 0.45 ? bulbGeo : branchGeo, mat);
          part.position.set((Math.random() - 0.5) * 1.4, Math.random() * 0.7, (Math.random() - 0.5) * 1.4);
          part.rotation.set((Math.random() - 0.5) * 0.7, Math.random() * Math.PI, (Math.random() - 0.5) * 0.7);
          part.scale.setScalar(0.7 + Math.random() * 1.0);
          cluster.add(part);
        }
        cluster.position.set(
          x + (Math.random() - 0.5) * sx * 1.1,
          rock.position.y + sy * (0.55 + Math.random() * 0.3),
          z + (Math.random() - 0.5) * sx * 1.1,
        );
        this.scene.add(cluster);
      }

      // Gloeiende anemoon op sommige rotsen
      if (i % 2 === 0) {
        const anemone = new THREE.Group();
        const glowMat = new THREE.MeshStandardMaterial({
          color: 0x9ff3ff, emissive: 0x36e0ff, emissiveIntensity: 1.4, roughness: 0.4,
        });
        anemone.add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), glowMat));
        for (let t = 0; t < 10; t++) {
          const ta = (t / 10) * Math.PI * 2;
          const tentacle = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.8, 4), glowMat);
          tentacle.position.set(Math.cos(ta) * 0.3, 0.35, Math.sin(ta) * 0.3);
          tentacle.rotation.set(Math.sin(ta) * 0.6, 0, -Math.cos(ta) * 0.6);
          anemone.add(tentacle);
        }
        anemone.position.set(
          x + (Math.random() - 0.5) * sx,
          rock.position.y + sy * 0.8,
          z + (Math.random() - 0.5) * sx,
        );
        this.scene.add(anemone);
      }
    }

    // Hoge kelpslierten rond het rif (wuiven mee via this.seaweed)
    const kelpMat = new THREE.MeshStandardMaterial({ color: 0x1f6e43, roughness: 0.8, side: THREE.DoubleSide });
    for (let k = 0; k < 18; k++) {
      const a = Math.random() * Math.PI * 2;
      const r = 14 + Math.random() * 14;
      const x = REEF_CENTER.x + Math.cos(a) * r;
      const z = REEF_CENTER.z + Math.sin(a) * r;
      const h = 10 + Math.random() * 7;
      const geo = new THREE.ConeGeometry(0.28, h, 5);
      geo.translate(0, h / 2, 0);
      const kelp = new THREE.Mesh(geo, kelpMat);
      kelp.position.set(x, groundHeight(x, z) - 0.2, z);
      this.scene.add(kelp);
      this.seaweed.push({
        mesh: kelp,
        phase: Math.random() * Math.PI * 2,
        lean: (Math.random() - 0.5) * 0.1,
        amp: 0.05 + Math.random() * 0.05,
      });
    }
  }

  buildBubbles() {
    const count = 160;
    const positions = new Float32Array(count * 3);
    this.bubbleSpeeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2 * (WORLD - 30);
      positions[i * 3 + 1] = Math.random() * 55;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2 * (WORLD - 30);
      this.bubbleSpeeds[i] = 2 + Math.random() * 3;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.bubbles = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.7, map: makeDotTexture(), transparent: true, opacity: 0.7,
      depthWrite: false, sizeAttenuation: true,
    }));
    this.scene.add(this.bubbles);
  }

  buildPlankton() {
    const count = 450;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2 * WORLD;
      positions[i * 3 + 1] = 2 + Math.random() * 55;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2 * WORLD;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.plankton = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.18, map: makeDotTexture(true), color: 0xbfe8ff, transparent: true,
      opacity: 0.5, depthWrite: false,
    }));
    this.scene.add(this.plankton);
  }

  buildLightRays() {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xeaf8ff, transparent: true, opacity: 0.06,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    });
    for (let i = 0; i < 8; i++) {
      const w = 6 + Math.random() * 16;
      const ray = new THREE.Mesh(new THREE.PlaneGeometry(w, 60), mat.clone());
      const [x, z] = randomSpot(0);
      ray.position.set(x * 0.6, 32, z * 0.6);
      ray.rotation.y = Math.random() * Math.PI;
      ray.rotation.z = (Math.random() - 0.5) * 0.25;
      this.scene.add(ray);
      this.rays.push({ mesh: ray, phase: Math.random() * Math.PI * 2, base: 0.04 + Math.random() * 0.05 });
    }
  }

  update(dt, time) {
    // Wier wuift
    for (const w of this.seaweed) {
      w.mesh.rotation.z = w.lean + Math.sin(time * 1.2 + w.phase) * w.amp;
      w.mesh.rotation.x = Math.sin(time * 0.9 + w.phase * 1.3) * w.amp * 0.6;
    }

    // Bubbels stijgen op
    const pos = this.bubbles.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + this.bubbleSpeeds[i] * dt;
      pos.setX(i, pos.getX(i) + Math.sin(time * 2 + i) * dt * 0.4);
      if (y > 58) y = 0.5;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;

    // Plankton zweeft heel traag rond
    this.plankton.rotation.y = time * 0.004;

    // Lichtstralen en caustics-flikkering
    for (const r of this.rays) {
      r.mesh.material.opacity = r.base + Math.sin(time * 0.7 + r.phase) * 0.025;
      r.mesh.rotation.y += dt * 0.02;
    }
    this.sun.intensity = 1.6 + Math.sin(time * 2.1) * 0.12 + Math.sin(time * 3.7) * 0.08;
  }
}
