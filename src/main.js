import * as THREE from 'three';
import { createFish, animateFish } from './fish.js';
import { Player, OCEAN_BOUNDS } from './player.js';
import { Flock } from './flock.js';
import { Environment, groundHeight } from './environment.js';
import { Nest } from './nest.js';
import { createHomeScene, HOME_BOUNDS } from './home.js';
import { FurniturePlacer, CATALOG } from './furniture.js';
import { setupUI } from './ui.js';
import { setupTouchControls, showTouchControls, touchInput } from './touch.js';
import { QUALITY, createEnvMap } from './realism.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const container = document.getElementById('game');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
if (QUALITY === 'hoog') {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);

const environment = new Environment(scene);

// Realistische reflecties: blauwige envmap buiten, warme binnen
scene.environment = createEnvMap(renderer, 0xa9dcff, 0x2d7cb0, 0x0d3a55, 0xfff2c4);

// Zachte schaduwen (alleen op de computer); het schaduwgebied volgt de speler
if (QUALITY === 'hoog') {
  const sun = environment.sun;
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -45;
  sun.shadow.camera.right = 45;
  sun.shadow.camera.top = 45;
  sun.shadow.camera.bottom = -45;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 250;
  sun.shadow.bias = -0.0005;
  scene.add(sun.target);
}

// Wilde scholen die hun eigen rondjes zwemmen
const wildSchools = [
  { shape: 'gewoon', color: 0xffd23f, count: 9, center: [50, 18, -40], r: 25, speed: 0.18 },
  { shape: 'lang',   color: 0x3a86ff, count: 7, center: [-60, 30, 30], r: 35, speed: 0.13 },
  { shape: 'dik',    color: 0xff70a6, count: 8, center: [20, 10, 70],  r: 20, speed: 0.22 },
  { shape: 'gewoon', color: 0x2ec4b6, count: 10, center: [-30, 40, -70], r: 30, speed: 0.16 },
].map((s) => new Flock(scene, {
  shape: s.shape,
  color: s.color,
  sizes: Array.from({ length: s.count }, () => 0.45 + Math.random() * 0.35),
  spread: 10,
  maxSpeed: 7,
  followRadius: 6,
  getAnchor: (t) => new THREE.Vector3(
    s.center[0] + Math.cos(t * s.speed) * s.r,
    s.center[1] + Math.sin(t * s.speed * 0.6) * 6,
    s.center[2] + Math.sin(t * s.speed) * s.r,
  ),
}));

// Keuzescherm: de vis van Mattis zweeft in beeld en draait rustig rond
const PREVIEW_POS = new THREE.Vector3(8, 24, 0);
let playerFish = createFish({ shape: 'gewoon', color: 0xff8c2e });
playerFish.position.copy(PREVIEW_POS);
scene.add(playerFish);

camera.position.set(PREVIEW_POS.x + 3.5, PREVIEW_POS.y + 1.5, PREVIEW_POS.z + 6);
camera.lookAt(PREVIEW_POS);

let player = null;
let family = null;
let gestart = false;

// Toast-meldingen (bovenaan in beeld)
const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(tekst, ms = 3500) {
  toastEl.textContent = tekst;
  toastEl.classList.remove('verborgen');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('verborgen'), ms);
}

// Het nest (toets N bij de bodem)
const nest = new Nest(scene, () => showToast('Het nest is klaar! 🐚'));
const nestAnchor = new THREE.Vector3();

function probeerNestBouwen() {
  if (!gestart || nest.isBuilding || activeWorld !== 'ocean') return;
  const p = playerFish.position;
  if (p.y - groundHeight(p.x, p.z) < 5) {
    nest.buildAt(p.x, p.z);
    showToast('Graven maar! 🐟💨');
  } else {
    showToast('Zwem naar de bodem om een nest te bouwen 🐚');
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyN' && !e.repeat) probeerNestBouwen();
});

// Op gsm/tablet: virtuele joystick + knoppen
const heeftTouch = setupTouchControls({ onNest: probeerNestBouwen });

// ----- De binnenwereld van het nest -----
const home = createHomeScene();
home.scene.environment = createEnvMap(renderer, 0xffe7c0, 0x8a6a45, 0x3a2c1c);

// Bloom-gloed op anemonen en lampjes (alleen op de computer)
let composer = null;
let renderPass = null;
if (QUALITY === 'hoog') {
  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  composer.addPass(new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 0.35, 0.5, 0.85,
  ));
  composer.addPass(new OutputPass());
}
const placer = new FurniturePlacer(home.scene, camera, renderer.domElement);
placer.loadFromStorage();

let activeWorld = 'ocean';
let switchCooldown = 0;
let huisHintGetoond = false;

const fadeEl = document.getElementById('fade');
function fadeSwitch(action) {
  fadeEl.classList.add('zichtbaar');
  setTimeout(() => {
    action();
    fadeEl.classList.remove('zichtbaar');
  }, 450);
}

// Meubelbalk opbouwen. Op touch-toestellen zit hij achter een 🪑-knopje
// (rechtsboven) en klapt hij dicht zodra je iets kiest, zodat de vloer
// vrij blijft om te tikken.
const balk = document.getElementById('meubel-balk');
const wisKnop = document.createElement('button');

const meubelToggle = document.createElement('div');
meubelToggle.id = 'meubel-toggle';
meubelToggle.className = 'touch-knop verborgen';
meubelToggle.textContent = '🪑';
document.body.appendChild(meubelToggle);
meubelToggle.addEventListener('click', () => balk.classList.toggle('verborgen'));

function sluitBalkOpTouch() {
  if (heeftTouch) balk.classList.add('verborgen');
}

for (const item of CATALOG) {
  const knop = document.createElement('button');
  knop.className = 'meubel-knop';
  knop.innerHTML = `<span class="meubel-emoji">${item.emoji}</span>${item.naam}`;
  knop.addEventListener('click', () => {
    wisKnop.classList.remove('actief');
    placer.select(item.id);
    sluitBalkOpTouch();
    showToast(heeftTouch
      ? `Tik op de vloer om je ${item.naam.toLowerCase()} neer te zetten`
      : `Klik op de vloer om je ${item.naam.toLowerCase()} neer te zetten (R = draaien)`);
  });
  balk.appendChild(knop);
}
wisKnop.className = 'meubel-knop';
wisKnop.innerHTML = '<span class="meubel-emoji">🗑️</span>Weghalen';
wisKnop.addEventListener('click', () => {
  const aan = placer.toggleDeleteMode();
  wisKnop.classList.toggle('actief', aan);
  if (aan) {
    sluitBalkOpTouch();
    showToast(heeftTouch
      ? 'Tik op een meubel om het weg te halen'
      : 'Klik op een meubel om het weg te halen (Esc = stoppen)');
  }
});
balk.appendChild(wisKnop);

function teleportFamilie(naarScene, spawn) {
  for (const boid of family.boids) {
    naarScene.add(boid.mesh);
    boid.mesh.position.set(
      spawn.x + (Math.random() - 0.5) * 3,
      spawn.y + (Math.random() - 0.5) * 2,
      spawn.z + (Math.random() - 0.5) * 3,
    );
    boid.vel.set(0, 0, 0);
  }
}

function gaNaarBinnen() {
  activeWorld = 'home';
  home.scene.add(playerFish);
  playerFish.position.set(0, 2.2, 8.5);
  player.yaw = Math.PI;
  player.orbitYaw = 0;
  player.speed = 0;
  player.verticalVel = 0;
  player.bounds = HOME_BOUNDS;
  player.camDist = 6.5;
  family.bounds = { radius: 11, minY: 0.8, maxY: 9 };
  teleportFamilie(home.scene, playerFish.position);
  placer.enabled = true;
  if (heeftTouch) {
    meubelToggle.classList.remove('verborgen');
  } else {
    balk.classList.remove('verborgen');
  }
  player.snapCamera();
  showToast('Welkom in je nestje! 🏠');
  if (!huisHintGetoond) {
    huisHintGetoond = true;
    setTimeout(() => showToast('Klik op een meubel en dan op de vloer om het neer te zetten', 6000), 4000);
  }
}

function gaNaarBuiten() {
  activeWorld = 'ocean';
  scene.add(playerFish);
  playerFish.position.copy(nest.position).add(new THREE.Vector3(0, 3, 0));
  player.speed = 0;
  player.verticalVel = 0;
  player.bounds = OCEAN_BOUNDS;
  player.camDist = 9;
  family.bounds = { radius: Infinity, minY: 2.5, maxY: 56 };
  teleportFamilie(scene, playerFish.position);
  placer.cancel();
  placer.enabled = false;
  balk.classList.add('verborgen');
  meubelToggle.classList.add('verborgen');
  player.snapCamera();
  showToast('Daar is de oceaan weer! 🌊');
}

function rebuildFish(vorm, kleur) {
  scene.remove(playerFish);
  playerFish = createFish({ shape: vorm, color: kleur });
  playerFish.position.copy(PREVIEW_POS);
  scene.add(playerFish);
}

setupUI({
  onChange: (vorm, kleur) => rebuildFish(vorm, kleur),
  onStart: (vorm, kleur) => {
    playerFish.rotation.set(0, 0, 0);
    player = new Player(playerFish, camera, renderer.domElement);
    player.blockDrag = () => placer.isActive;
    if (heeftTouch) {
      player.touchInput = touchInput;
      showTouchControls();
    }

    // De familie: zelfde soort en kleur als Mattis' vis.
    // Papa en mama iets groter, broertjes en zusjes kleiner.
    family = new Flock(scene, {
      shape: vorm,
      color: kleur,
      sizes: [1.25, 1.1, 0.55, 0.5, 0.45],
      spread: 6,
      maxSpeed: 15,
      followRadius: 4.5,
      // Is het nest klaar en blijft Mattis in de buurt, dan nestelt
      // de familie zich in de kuil; anders zwemmen ze met hem mee.
      getAnchor: () => {
        if (nest.isReady && playerFish.position.distanceTo(nest.position) < 12) {
          return nestAnchor.copy(nest.position).setY(nest.position.y + 0.6);
        }
        return playerFish.position;
      },
    });

    gestart = true;
  },
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer?.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  if (activeWorld === 'ocean') {
    environment.update(dt, time);
    nest.update(dt);
    for (const school of wildSchools) school.update(dt, time);

    // Schaduwgebied volgt de speler (of de preview-vis)
    if (QUALITY === 'hoog') {
      const focus = playerFish.position;
      environment.sun.position.set(focus.x + 30, focus.y + 90, focus.z + 20);
      environment.sun.target.position.copy(focus);
      environment.sun.target.updateMatrixWorld();
    }
  } else {
    home.update(dt, time);
  }

  if (gestart) {
    player.update(dt);
    family.update(dt, time);

    // Wereldwissel: het nest in zwemmen of door het deurtje naar buiten
    switchCooldown -= dt;
    if (switchCooldown <= 0) {
      const p = playerFish.position;
      if (activeWorld === 'ocean' && nest.isReady) {
        const horiz = Math.hypot(p.x - nest.position.x, p.z - nest.position.z);
        if (horiz < 2.4 && p.y - nest.position.y < 4) {
          switchCooldown = 2;
          fadeSwitch(gaNaarBinnen);
        }
      } else if (activeWorld === 'home') {
        if (p.distanceTo(home.doorPos) < 2.6) {
          switchCooldown = 2;
          fadeSwitch(gaNaarBuiten);
        }
      }
    }
  } else {
    // Keuzescherm: vis draait langzaam rond en dobbert
    playerFish.rotation.y += dt * 0.6;
    playerFish.position.y = PREVIEW_POS.y + Math.sin(time * 1.3) * 0.15;
    animateFish(playerFish, dt, 0.15);
  }

  const activeScene = activeWorld === 'home' ? home.scene : scene;
  if (composer) {
    renderPass.scene = activeScene;
    composer.render();
  } else {
    renderer.render(activeScene, camera);
  }
}
animate();
