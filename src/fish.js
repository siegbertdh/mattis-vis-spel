import * as THREE from 'three';

// Drie visvormen: [lengte, hoogte, breedte] van de romp
export const FISH_SHAPES = {
  gewoon: { naam: 'Gewone vis', body: [1.5, 1.0, 0.65], tail: 1.0, fin: 1.0 },
  dik:    { naam: 'Dikke vis',  body: [1.15, 1.15, 0.95], tail: 0.9, fin: 1.25 },
  lang:   { naam: 'Lange vis',  body: [2.3, 0.75, 0.5], tail: 1.15, fin: 0.8 },
};

export const FISH_COLORS = [
  { naam: 'Oranje',    hex: 0xff8c2e },
  { naam: 'Geel',      hex: 0xffd23f },
  { naam: 'Rood',      hex: 0xef476f },
  { naam: 'Blauw',     hex: 0x3a86ff },
  { naam: 'Groen',     hex: 0x52b788 },
  { naam: 'Roze',      hex: 0xff70a6 },
  { naam: 'Paars',     hex: 0x9d4edd },
  { naam: 'Turquoise', hex: 0x2ec4b6 },
];

// Bouwt een vis uit simpele vormen. De neus wijst naar +Z.
export function createFish({ shape = 'gewoon', color = 0xff8c2e, size = 1 } = {}) {
  const def = FISH_SHAPES[shape];
  const [len, hgt, wid] = def.body;
  const group = new THREE.Group();

  const skin = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
  const finColor = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.25);
  const finMat = new THREE.MeshStandardMaterial({
    color: finColor, roughness: 0.6, transparent: true, opacity: 0.92, side: THREE.DoubleSide,
  });

  // Romp
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), skin);
  body.scale.set(wid, hgt, len);
  group.add(body);

  // Staart (kegel, punt aan de romp, waaiert naar achter)
  const tailPivot = new THREE.Group();
  tailPivot.position.z = -len * 0.88;
  const tailLen = 1.1 * def.tail;
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.6 * def.tail, tailLen, 6), finMat);
  tail.rotation.x = Math.PI / 2;       // punt naar +Z (richting romp)
  tail.scale.x = 0.22;                 // plat blad
  tail.position.z = -tailLen / 2;
  tailPivot.add(tail);
  group.add(tailPivot);

  // Rugvin
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.35 * def.fin, 0.7 * def.fin, 5), finMat);
  dorsal.scale.x = 0.2;
  dorsal.rotation.x = -0.45;           // leunt naar achter
  dorsal.position.set(0, hgt * 0.92, -len * 0.1);
  group.add(dorsal);

  // Zijvinnen
  const makeSideFin = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * wid * 0.85, -hgt * 0.1, len * 0.2);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.28 * def.fin, 0.6 * def.fin, 5), finMat);
    fin.scale.z = 0.25;
    fin.rotation.z = side * 2.1;       // punt schuin naar buiten/onder
    fin.position.x = side * 0.25;
    pivot.add(fin);
    group.add(pivot);
    return pivot;
  };
  const finL = makeSideFin(-1);
  const finR = makeSideFin(1);

  // Ogen
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), eyeWhiteMat);
    eye.position.set(side * wid * 0.72, hgt * 0.28, len * 0.6);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), pupilMat);
    pupil.position.set(side * 0.05, 0, 0.1);
    eye.add(pupil);
    group.add(eye);
  }

  group.scale.setScalar(size);
  group.userData = {
    tailPivot, finL, finR,
    swimPhase: Math.random() * Math.PI * 2,
  };
  return group;
}

// Laat staart en vinnen wiegen. speedFactor 0 = stilhangen, 1 = volle vaart.
export function animateFish(fish, dt, speedFactor = 0) {
  const ud = fish.userData;
  ud.swimPhase += dt * (3.5 + speedFactor * 9);
  const wig = Math.sin(ud.swimPhase);
  ud.tailPivot.rotation.y = wig * (0.25 + speedFactor * 0.3);
  ud.finL.rotation.y = wig * 0.18;
  ud.finR.rotation.y = -wig * 0.18;
}
