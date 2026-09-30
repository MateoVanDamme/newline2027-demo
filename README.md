# NewLine 2027

Landing page for Hackerspace Gent's NewLine event, a show and tell for hackers, makers and tinkerers.

**28-29-30 May 2027** at Hackerspace Gent

## Tech

- Static HTML/CSS/JS, no build process
- three.js (r128, cdnjs) raymarched "void": black noise fog, light beams, random QR and text panels flying past
- The page headings are not in the DOM: they are neon text signs inside the scene. Each section has a sign hanging ahead in the void; scrolling flies the camera forward and past it (`BOARDS` in `main.js`)
- Info is plain monospace on black strips and a departure-board layout, text decodes out of static as it scrolls in
- No webfonts: headings use a procedural 5x7 block-stencil typeface drawn on canvas (`blockfont.js`), Courier for everything else
- Live schedule pulled from pretalx (`schedule-data.js`)

Serve the folder over http (VS Code Live Server, `python -m http.server`, GitHub Pages); the shaders are fetched at startup so `file://` will not work. The void needs WebGL. The fog renders at a fixed fraction of the screen (`FOG_SCALE` at the top of `main.js`), the small text is drawn at full resolution on top.

## Files

- `index.html`, `style.css`, `script.js`: the landing page
- `main.js`: the three.js scene. Tunables at the top; `SIGNS` = random panels, `BOARDS` = the heading signs per section (`hi: true` = drawn at full res)
- `shaders/`: `common.glsl` (noise, beams, sign intersection), `fog.frag` (low-res pass), `text.frag` (full-res small text pass), `quad.vert`
- `schedule.html`, `upnext.html`: full schedule and "up next" screen for on site
- `newline-2027.ics`: calendar file

Based on the byob2027schizo demo.
