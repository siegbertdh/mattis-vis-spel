# 🐠 Mattis' Vissenspel

Een rustig onderwaterspel zonder vijanden: kies je vis, zwem rond met je
visjesfamilie en geniet van de oceaan.

## Starten

```bash
cd ~/mattis-vis-spel
python3 -m http.server 8000
```

Open daarna **http://localhost:8000** in je browser.

## Besturing

| Actie | Toets |
|---|---|
| Zwemmen | Pijltjes of WASD |
| Omhoog | Spatie (of Q) |
| Omlaag | Shift (of E) |
| Rondkijken | Slepen met de muis |
| In-/uitzoomen | Scrollwiel |
| Nest bouwen (bij de bodem) | N |

Bouw een nest op de zeebodem: zwem naar beneden en druk op **N**. Je vis
graaft een kuil met een rand van schelpen en steentjes. Blijf in de buurt
en je hele familie komt knus in het nest liggen! Druk ergens anders nog
eens op N om het nest te verplaatsen.

## Je eigen huisje 🏠

Zwem het nest in en je komt in je eigen holletje onder het zand — je
familie zwemt gezellig mee! Onderaan verschijnt een meubelbalk: klik op
een meubel (schelpenbed, kwallenlamp, schatkist…) en dan op de vloer om
het neer te zetten. **R** draait het meubel, **Esc** annuleert, en met
🗑️ Weghalen klik je meubels weer weg. Alles wordt automatisch bewaard.
Door het gloeiende deurtje zwem je terug naar de oceaan.

## Het koraalrif 🪸

Ver weg in de oceaan ligt een rif met grote donkere rotsen vol gekleurd
koraal en gloeiende anemonen, omringd door hoge kelpslierten. Zwem erheen
en ontdek het!

## Technisch

- Three.js (lokaal in `lib/`, werkt dus ook zonder internet)
- Geen build-stap, geen npm — gewoon ES-modules in de browser
- Alles procedureel gegenereerd: vissen, wier, koraal, bubbels
