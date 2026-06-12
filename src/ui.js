import { FISH_COLORS } from './fish.js';

// Bouwt het keuzescherm op en meldt keuzes terug aan main.js.
export function setupUI({ onChange, onStart }) {
  const overlay = document.getElementById('overlay');
  const hulp = document.getElementById('hulp');
  const kleurenDiv = document.getElementById('kleuren');

  let vorm = 'gewoon';
  let kleur = FISH_COLORS[0].hex;

  for (const knop of document.querySelectorAll('.vorm-knop')) {
    knop.addEventListener('click', () => {
      document.querySelector('.vorm-knop.selected')?.classList.remove('selected');
      knop.classList.add('selected');
      vorm = knop.dataset.vorm;
      onChange(vorm, kleur);
    });
  }

  FISH_COLORS.forEach((c, i) => {
    const bol = document.createElement('div');
    bol.className = 'kleur-bol' + (i === 0 ? ' selected' : '');
    bol.style.background = '#' + c.hex.toString(16).padStart(6, '0');
    bol.title = c.naam;
    bol.addEventListener('click', () => {
      document.querySelector('.kleur-bol.selected')?.classList.remove('selected');
      bol.classList.add('selected');
      kleur = c.hex;
      onChange(vorm, kleur);
    });
    kleurenDiv.appendChild(bol);
  });

  document.getElementById('start-knop').addEventListener('click', () => {
    overlay.classList.add('weg');
    setTimeout(() => { overlay.style.display = 'none'; }, 900);
    hulp.classList.remove('verborgen');
    // Hulpbalk na een tijdje laten vervagen
    setTimeout(() => hulp.classList.add('verborgen'), 20000);
    onStart(vorm, kleur);
  });
}
