# Mattis' Vissenspel — context voor Claude

Onderwaterspel voor Mattis (zoon van Siegbert): rustig zwemmen als vis,
**géén vijanden, geen score** — dat is een bewuste ontwerpkeuze, nooit toevoegen
zonder dat erom gevraagd wordt. UI-teksten in het **Nederlands**, vrolijke stijl.

## Stack & draaien

- Vanilla three.js (lokaal in `lib/three.module.js`, v0.165), ES-modules, **geen build-stap/npm**
- Lokaal testen: `python3 -m http.server 8000` → http://localhost:8000
- Live: https://siegbertdh.github.io/mattis-vis-spel/ (GitHub Pages, branch `main`, cache 10 min)
- Headless verifiëren: Chrome `--headless --use-angle=swiftshader --timeout=20000 --screenshot=...`
  (NIET `--virtual-time-budget`: hangt op de rAF-loop). Animaties doorspoelen in een
  tijdelijke testpagina vóór de screenshot.

## Architectuur (src/)

- `main.js` — gameloop, wereldwissel oceaan↔huisje (twee scenes, één camera, fade), meubelbalk, toasts
- `fish.js` — procedurele vis (3 vormen × 8 kleuren), neus wijst +Z; `animateFish(fish, dt, speedFactor)`
- `player.js` — besturing (WASD/pijltjes, spatie/shift), camera-follow + muis-orbit, `bounds` instelbaar, `touchInput` voor joystick
- `flock.js` — boids; familie (anker = spelersvis, zelfde vorm+kleur!) én wilde scholen
- `environment.js` — oceaan: zand+caustics, wateroppervlak, wier, koraal, rif (`REEF_CENTER`), bubbels; `groundHeight(x,z)` is dé bodemfunctie
- `nest.js` — nest bouwen (toets N bij de bodem); erin zwemmen = naar binnen
- `home.js` — koepelkamer-scene met deurtje (uitgang); `HOME_BOUNDS`
- `furniture.js` — meubelcatalogus + plaatsen/verwijderen, opgeslagen in localStorage `mattis-nest-meubels`
- `touch.js` — virtuele joystick + knoppen (gsm); meubelmenu zit daar achter een 🪑-knopje
- `realism.js` — `QUALITY` ('laag' = touch: geen schaduw/bloom; forceer met `?q=laag|hoog`), texturen-loader, caustics/water-normals/envmap-generators

## Assets

- `assets/` — CC0 PBR-texturen (Poly Haven): zand, rots, hout (diff + nor, 1k)
- `lib/addons/` — vendored three postprocessing (UnrealBloom, alleen desktop)

## Werkwijze

- Na elke wijziging: `node --input-type=module --check < src/bestand.js` + headless screenshot
- Commit + push naar `main` zet het automatisch live op Pages
