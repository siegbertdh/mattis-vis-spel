import * as THREE from 'three';
import { animateFish } from './fish.js';

const MAX_SPEED = 14;
const TURN_SPEED = 1.9;
const VERTICAL_SPEED = 7;

export const OCEAN_BOUNDS = { radius: 130, minY: 3, maxY: 55 };

export class Player {
  constructor(fish, camera, dom) {
    this.fish = fish;
    this.camera = camera;
    this.speed = 0;
    this.verticalVel = 0;
    this.yaw = fish.rotation.y;
    this.bank = 0;
    this.visualPitch = 0;

    // Camera-orbit (muis)
    this.orbitYaw = 0;
    this.orbitPitch = 0.28;
    this.camDist = 9;
    this.dragging = false;
    this.bounds = OCEAN_BOUNDS;
    this.blockDrag = null; // callback; true = muis is bezig met meubels

    this.keys = new Set();
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    dom.addEventListener('pointerdown', (e) => {
      if (this.blockDrag?.()) return;
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      this.orbitYaw -= (e.clientX - this.lastX) * 0.005;
      this.orbitPitch = THREE.MathUtils.clamp(
        this.orbitPitch + (e.clientY - this.lastY) * 0.004, -0.4, 1.1);
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });
    window.addEventListener('pointerup', () => { this.dragging = false; });
    dom.addEventListener('wheel', (e) => {
      this.camDist = THREE.MathUtils.clamp(this.camDist + e.deltaY * 0.01, 5, 18);
    }, { passive: true });
  }

  key(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  // Camera meteen achter de vis zetten (bij wereldwissel, fade verbergt de sprong)
  snapCamera() {
    const pos = this.fish.position;
    const camYaw = this.yaw + this.orbitYaw;
    const horiz = Math.cos(this.orbitPitch) * this.camDist;
    this.camera.position.set(
      pos.x - Math.sin(camYaw) * horiz,
      pos.y + Math.sin(this.orbitPitch) * this.camDist + 1.5,
      pos.z - Math.cos(camYaw) * horiz,
    );
    this.camera.lookAt(pos.x, pos.y + 0.8, pos.z);
  }

  update(dt) {
    const fwd = this.key('ArrowUp', 'KeyW');
    const back = this.key('ArrowDown', 'KeyS');
    const left = this.key('ArrowLeft', 'KeyA');
    const right = this.key('ArrowRight', 'KeyD');
    const up = this.key('Space', 'KeyQ');
    const down = this.key('ShiftLeft', 'ShiftRight', 'KeyE');

    // Snelheid: rustig optrekken, zachtjes uitdrijven
    const targetSpeed = fwd ? MAX_SPEED : back ? -MAX_SPEED * 0.4 : 0;
    this.speed += (targetSpeed - this.speed) * (1 - Math.exp(-dt * 2.5));

    // Draaien + schuin hangen in de bocht
    const turn = (left ? 1 : 0) - (right ? 1 : 0);
    this.yaw += turn * TURN_SPEED * dt;
    this.bank += (turn * -0.35 - this.bank) * (1 - Math.exp(-dt * 5));

    // Omhoog / omlaag
    const targetVert = (up ? VERTICAL_SPEED : 0) - (down ? VERTICAL_SPEED : 0);
    this.verticalVel += (targetVert - this.verticalVel) * (1 - Math.exp(-dt * 3));
    this.visualPitch += (this.verticalVel * 0.045 - this.visualPitch) * (1 - Math.exp(-dt * 5));

    // Bewegen
    const pos = this.fish.position;
    pos.x += Math.sin(this.yaw) * this.speed * dt;
    pos.z += Math.cos(this.yaw) * this.speed * dt;
    pos.y += this.verticalVel * dt;

    // Zachte grenzen: vriendelijk terugduwen
    const { radius, minY, maxY } = this.bounds;
    const r = Math.hypot(pos.x, pos.z);
    if (r > radius) {
      const push = (r - radius) * 1.5 * dt;
      pos.x -= (pos.x / r) * push * 10;
      pos.z -= (pos.z / r) * push * 10;
    }
    if (pos.y < minY) pos.y += (minY - pos.y) * dt * 4;
    if (pos.y > maxY) pos.y -= (pos.y - maxY) * dt * 4;

    // Dobberen bij stilhangen
    const idle = 1 - Math.min(1, Math.abs(this.speed) / 3);
    pos.y += Math.sin(performance.now() * 0.0012) * 0.004 * idle;

    // Vis-oriëntatie
    this.fish.rotation.order = 'YXZ';
    this.fish.rotation.y = this.yaw;
    this.fish.rotation.x = this.visualPitch;
    this.fish.rotation.z = this.bank;

    animateFish(this.fish, dt, Math.abs(this.speed) / MAX_SPEED);

    // Camera-orbit drijft terug naar achter de vis zodra je vooruit zwemt
    if (!this.dragging && fwd) {
      this.orbitYaw *= Math.exp(-dt * 1.2);
      this.orbitPitch += (0.28 - this.orbitPitch) * (1 - Math.exp(-dt * 0.8));
    }

    // Camera zacht achter de vis
    const camYaw = this.yaw + this.orbitYaw;
    const horiz = Math.cos(this.orbitPitch) * this.camDist;
    const target = new THREE.Vector3(
      pos.x - Math.sin(camYaw) * horiz,
      pos.y + Math.sin(this.orbitPitch) * this.camDist + 1.5,
      pos.z - Math.cos(camYaw) * horiz,
    );
    this.camera.position.lerp(target, 1 - Math.exp(-dt * 4));
    this.camera.lookAt(pos.x, pos.y + 0.8, pos.z);
  }
}
