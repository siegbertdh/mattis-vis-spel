// Touch-besturing voor op de gsm/tablet: virtuele joystick links
// (zwemmen + draaien), knoppen rechts (omhoog/omlaag/nest).
// De rest van het scherm blijft camera-slepen, net als met de muis.

export const touchInput = { forward: 0, turn: 0, vertical: 0 };

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function setupTouchControls({ onNest }) {
  if (!isTouchDevice()) return false;

  const maak = (id, className, html = '') => {
    const el = document.createElement('div');
    el.id = id;
    el.className = className;
    el.innerHTML = html;
    document.body.appendChild(el);
    return el;
  };

  // Joystick
  const stick = maak('joystick', 'touch-ui verborgen', '<div id="joystick-knob"></div>');
  const knob = stick.firstElementChild;
  let stickPointer = null;

  const RADIUS = 48;
  function zetKnob(dx, dy) {
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    touchInput.turn = dx / RADIUS;
    touchInput.forward = -dy / RADIUS;
  }

  stick.addEventListener('pointerdown', (e) => {
    stickPointer = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    e.stopPropagation();
  });
  stick.addEventListener('pointermove', (e) => {
    if (e.pointerId !== stickPointer) return;
    const rect = stick.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx *= RADIUS / len;
      dy *= RADIUS / len;
    }
    zetKnob(dx, dy);
  });
  const laatLos = (e) => {
    if (e.pointerId !== stickPointer) return;
    stickPointer = null;
    zetKnob(0, 0);
  };
  stick.addEventListener('pointerup', laatLos);
  stick.addEventListener('pointercancel', laatLos);

  // Omhoog / omlaag / nest-knoppen
  const knoppen = maak('touch-knoppen', 'touch-ui verborgen');
  const maakKnop = (label, onDown, onUp) => {
    const k = document.createElement('div');
    k.className = 'touch-knop';
    k.textContent = label;
    k.addEventListener('pointerdown', (e) => {
      k.setPointerCapture(e.pointerId);
      onDown();
      e.stopPropagation();
    });
    const stop = () => onUp?.();
    k.addEventListener('pointerup', stop);
    k.addEventListener('pointercancel', stop);
    knoppen.appendChild(k);
    return k;
  };
  maakKnop('⬆️', () => { touchInput.vertical = 1; }, () => { touchInput.vertical = 0; });
  maakKnop('⬇️', () => { touchInput.vertical = -1; }, () => { touchInput.vertical = 0; });
  maakKnop('🐚', () => onNest());

  return true;
}

// Toon de touch-bediening (na het keuzescherm)
export function showTouchControls() {
  for (const el of document.querySelectorAll('.touch-ui')) el.classList.remove('verborgen');
}
