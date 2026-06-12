import * as THREE from 'three';
import { createFish, animateFish } from './fish.js';

const _v = new THREE.Vector3();
const _steer = new THREE.Vector3();
const _dummy = new THREE.Object3D();

// Een schooltje vissen met simpel boids-gedrag dat een ankerpunt volgt.
// Wordt gebruikt voor de familie (anker = Mattis' vis) en wilde scholen
// (anker = rondzwemmend doelpunt).
export class Flock {
  constructor(scene, { shape, color, sizes, getAnchor, spread = 6, maxSpeed = 10, followRadius = 5 }) {
    this.getAnchor = getAnchor;
    this.maxSpeed = maxSpeed;
    this.followRadius = followRadius;
    this.bounds = { radius: Infinity, minY: 2.5, maxY: 56 };
    this.boids = [];

    const anchor = getAnchor(0);
    for (const size of sizes) {
      const mesh = createFish({ shape, color, size });
      mesh.position.set(
        anchor.x + (Math.random() - 0.5) * spread,
        anchor.y + (Math.random() - 0.5) * spread,
        anchor.z + (Math.random() - 0.5) * spread,
      );
      scene.add(mesh);
      this.boids.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2),
        wander: Math.random() * Math.PI * 2,
      });
    }
  }

  update(dt, time) {
    const anchor = this.getAnchor(time);

    for (const boid of this.boids) {
      const pos = boid.mesh.position;
      _steer.set(0, 0, 0);

      // Naar het anker toe, harder naarmate je verder weg bent
      _v.copy(anchor).sub(pos);
      const distToAnchor = _v.length();
      if (distToAnchor > this.followRadius) {
        _steer.addScaledVector(_v.normalize(), (distToAnchor - this.followRadius) * 2.5);
      }

      // Cohesie + separatie + alignment binnen de groep
      let neighbors = 0;
      const cohesion = _v.set(0, 0, 0);
      for (const other of this.boids) {
        if (other === boid) continue;
        const d = pos.distanceTo(other.mesh.position);
        if (d < 8) {
          cohesion.add(other.mesh.position);
          _steer.addScaledVector(other.vel, 0.06);
          neighbors++;
        }
        if (d < 1.6 && d > 0.001) {
          _steer.addScaledVector(
            new THREE.Vector3().copy(pos).sub(other.mesh.position).normalize(),
            (1.6 - d) * 6,
          );
        }
      }
      if (neighbors > 0) {
        cohesion.divideScalar(neighbors).sub(pos);
        _steer.addScaledVector(cohesion, 0.25);
      }

      // Niet ín het anker zwemmen (bv. niet door Mattis' vis heen)
      if (distToAnchor < 2 && distToAnchor > 0.001) {
        _steer.addScaledVector(_v.copy(pos).sub(anchor).normalize(), (2 - distToAnchor) * 4);
      }

      // Beetje eigen wil
      boid.wander += dt * (0.5 + Math.random() * 0.5);
      _steer.x += Math.sin(boid.wander) * 0.6;
      _steer.y += Math.sin(boid.wander * 0.7) * 0.35;
      _steer.z += Math.cos(boid.wander * 0.9) * 0.6;

      boid.vel.addScaledVector(_steer, dt * 2);
      const speed = boid.vel.length();
      if (speed > this.maxSpeed) boid.vel.multiplyScalar(this.maxSpeed / speed);

      // Binnen de grenzen blijven (bodem, oppervlak, muren)
      if (pos.y < this.bounds.minY) boid.vel.y += (this.bounds.minY - pos.y) * dt * 8;
      if (pos.y > this.bounds.maxY) boid.vel.y -= (pos.y - this.bounds.maxY) * dt * 8;
      const rr = Math.hypot(pos.x, pos.z);
      if (rr > this.bounds.radius) {
        boid.vel.x -= (pos.x / rr) * (rr - this.bounds.radius) * dt * 8;
        boid.vel.z -= (pos.z / rr) * (rr - this.bounds.radius) * dt * 8;
      }

      pos.addScaledVector(boid.vel, dt);

      // Soepel in de zwemrichting draaien
      if (speed > 0.2) {
        _dummy.position.copy(pos);
        _dummy.lookAt(_v.copy(pos).add(boid.vel));
        boid.mesh.quaternion.slerp(_dummy.quaternion, 1 - Math.exp(-dt * 5));
      }

      animateFish(boid.mesh, dt, Math.min(1, speed / this.maxSpeed));
    }
  }
}
