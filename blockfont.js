// BLOCKFONT — a heavy 5x7 stencil typeface drawn as bars on a canvas.
// Wide cells, a forward skew and a cut through the middle of every glyph.
// Used for the signs inside the void (main.js) and the board headings (script.js).
const BLOCKFONT = (() => {
  const G = {
    "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "B": ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
    "C": [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
    "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
    "E": ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
    "F": ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
    "G": [".####", "#....", "#....", "#.###", "#...#", "#...#", ".####"],
    "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "I": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    "J": ["....#", "....#", "....#", "....#", "....#", "#...#", ".###."],
    "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
    "N": ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
    "O": ["#####", "#...#", "#...#", "#...#", "#...#", "#...#", "#####"],
    "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
    "Q": ["#####", "#...#", "#...#", "#...#", "#.#.#", "#..#.", "###.#"],
    "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
    "S": [".####", "#....", "#....", "#####", "....#", "....#", "####."],
    "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", "#####"],
    "V": ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
    "W": ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
    "X": ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
    "Y": ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
    "Z": ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
    "0": ["#####", "#...#", "#..##", "#.#.#", "##..#", "#...#", "#####"],
    "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", "#####"],
    "2": ["#####", "....#", "....#", "#####", "#....", "#....", "#####"],
    "3": ["#####", "....#", "....#", ".####", "....#", "....#", "#####"],
    "4": ["#...#", "#...#", "#...#", "#####", "....#", "....#", "....#"],
    "5": ["#####", "#....", "#....", "#####", "....#", "....#", "#####"],
    "6": ["#####", "#....", "#....", "#####", "#...#", "#...#", "#####"],
    "7": ["#####", "....#", "....#", "...#.", "..#..", "..#..", "..#.."],
    "8": ["#####", "#...#", "#...#", "#####", "#...#", "#...#", "#####"],
    "9": ["#####", "#...#", "#...#", "#####", "....#", "....#", "#####"],
    ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
    ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
    "'": [".##..", ".##..", "..#..", ".....", ".....", ".....", "....."],
    "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
    ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
    "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
    "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
    "[": ["###..", "#....", "#....", "#....", "#....", "#....", "###.."],
    "]": ["..###", "....#", "....#", "....#", "....#", "....#", "..###"],
    "&": [".##..", "#..#.", "#..#.", ".##..", "#.#.#", "#..#.", ".##.#"],
    " ": null
  };
  const ROWS = 7, COLS = 5, GAP = 1, SPACE = 3;

  // width of the text in cells
  function cells(text) {
    let w = 0;
    for (const ch of text.toUpperCase()) w += (ch === " " ? SPACE : COLS) + GAP;
    return Math.max(0, w - GAP);
  }

  // opts: wide (cell width / cell height, default 1.15), skew (0..0.4), cut (0/1), outline (px), color, rowGap (0..0.3)
  function draw(g, text, x, y, cellH, opts = {}) {
    const wide = opts.wide ?? 1.15, skew = opts.skew ?? 0.16, cut = opts.cut ?? 1;
    const outline = opts.outline ?? 0, color = opts.color ?? "#fff", rowGap = opts.rowGap ?? 0.08;
    const cw = cellH * wide, gh = cellH * (1 - rowGap);
    const T = text.toUpperCase();
    g.save();
    g.translate(x, y);
    g.transform(1, 0, -skew, 1, skew * cellH * ROWS * 0.5, 0);
    const pass = (col, o) => {
      g.fillStyle = col;
      let cx = 0;
      for (const ch of T) {
        const rows = G[ch];
        if (rows === undefined) { cx += (COLS + GAP) * cw; continue; }
        if (rows === null) { cx += (SPACE + GAP) * cw; continue; }
        for (let r = 0; r < ROWS; r++) {
          // merge runs of cells into one bar
          let c = 0;
          while (c < COLS) {
            if (rows[r][c] !== "#") { c++; continue; }
            let e = c; while (e < COLS && rows[r][e] === "#") e++;
            g.fillRect(cx + c * cw - o, r * cellH - o, (e - c) * cw + o * 2, gh + o * 2);
            c = e;
          }
        }
        cx += (COLS + GAP) * cw;
      }
    };
    if (outline > 0) pass("#000", outline);
    pass(color, 0);
    if (cut) {
      // stencil cut straight through the word
      g.fillStyle = opts.cutColor ?? "#000";
      g.fillRect(-outline - cellH, cellH * 3.55, cells(T) * cw + outline * 2 + cellH * 2, cellH * 0.22);
    }
    g.restore();
    return cells(T) * cw;
  }

  // cell height so that text fits in maxW x maxH
  function fit(text, maxW, maxH, wide = 1.15) {
    const w = cells(text) * wide;
    return Math.min(maxH / ROWS, maxW / w);
  }

  function width(text, cellH, wide = 1.15) { return cells(text) * cellH * wide; }
  function height(cellH) { return cellH * ROWS; }

  // marathon furniture
  function hazard(g, x, y, w, h, stripe = 12) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = "#000"; g.fillRect(x, y, w, h);
    g.fillStyle = "#fff";
    for (let i = -h; i < w + h; i += stripe * 2) {
      g.beginPath(); g.moveTo(x + i, y + h); g.lineTo(x + i + h, y); g.lineTo(x + i + h + stripe, y); g.lineTo(x + i + stripe, y + h); g.closePath(); g.fill();
    }
    g.restore();
  }
  function barcode(g, x, y, w, h, seed = 1) {
    let s = seed * 9301 + 49297;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    g.fillStyle = "#000"; g.fillRect(x, y, w, h);
    g.fillStyle = "#fff";
    let cx = x;
    while (cx < x + w) { const bw = 2 + Math.floor(rnd() * 4); if (rnd() < 0.55) g.fillRect(cx, y, bw, h); cx += bw + 1 + Math.floor(rnd() * 2); }
  }

  return { draw, fit, width, height, cells, hazard, barcode, ROWS };
})();
