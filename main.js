// NewLine 2027 — the void
// Raymarched black noise, light beams, random QR signs flying past,
// and the page's headings rendered as block-stencil signs inside the scene.
// Scrolling the page flies the camera forward; each section's sign waits
// ahead in the void and is passed as you scroll through it.

// ---------------------------------------------------------------- tunables
const FOG_SCALE = 0.4;      // render resolution of the fog + big signs (0..1). Lower = chunkier blocks. Small text is always full res.
const BASE_SPEED = 4;        // constant forward drift, units per second
const UNITS_PER_VH = 22;     // one viewport of scrolling = this many units of flight
const AHEAD = 6.5;           // how far ahead a section's sign hangs when that section is at the top of the screen

// ---------------------------------------------------------------- random QR / text signs
const SIGNS = [
  { qr: "https://newline.gent" },
  { text: ["KEEP", "FLYING"] },
  { qr: "https://cfp.hackerspace.gent" },
  { text: ["FREE", "ENTRY"] },
  { qr: "NEWLINE 2027 // HACKERSPACE GENT" },
  { text: ["NO", "EXIT"] },
  { qr: "https://hackerspace.gent" },
  { text: ["SCAN", "THE", "OTHER", "ONE"] },
  { qr: "WIEDAUWKAAI 51, 9000 GENT" },
  { text: ["BRING", "YOUR", "THING"] },
  { qr: "https://chat.hackerspace.gent" },
  { text: ["SIGNAL", "LOST"] },
  { qr: "KEEP FLYING" },
  { text: ["MAY", "2027"] },
  { qr: "END OF TRANSMISSION" },
  { text: ["GENT", "BE"] },
];
const GRID = 4, CELL = 256;

function buildAtlas() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = GRID * CELL;
  const g = cv.getContext("2d");
  g.fillStyle = "#000"; g.fillRect(0, 0, cv.width, cv.height);
  SIGNS.forEach((sign, i) => {
    const ox = (i % GRID) * CELL, oy = Math.floor(i / GRID) * CELL;
    g.fillStyle = "#fff"; g.fillRect(ox + 6, oy + 6, CELL - 12, CELL - 12);
    g.fillStyle = "#000"; g.fillRect(ox + 10, oy + 10, CELL - 20, CELL - 20);
    g.fillStyle = "#fff"; g.fillRect(ox + 14, oy + 14, CELL - 28, CELL - 28);

    if (sign.text) {
      g.fillStyle = "#000"; g.fillRect(ox + 22, oy + 22, CELL - 44, CELL - 44);
      const lines = sign.text, lh = (CELL - 60) / lines.length;
      g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
      lines.forEach((ln, k) => {
        let size = Math.min(lh * 0.8, 64);
        g.font = `bold ${size}px "Courier New", monospace`;
        while (g.measureText(ln).width > CELL - 64 && size > 14) { size -= 2; g.font = `bold ${size}px "Courier New", monospace`; }
        g.fillText(ln, ox + CELL / 2, oy + 30 + lh * (k + 0.5));
      });
      return;
    }
    let n, dark;
    try {
      const qr = qrcode(0, "M"); qr.addData(sign.qr); qr.make();
      n = qr.getModuleCount(); dark = (r, c) => qr.isDark(r, c);
    } catch (e) {
      n = 29; dark = (r, c) => ((r * 7919 + c * 104729 + i * 31) % 97) < 45;
    }
    const quiet = 3, span = n + quiet * 2, m = (CELL - 28) / span;
    g.fillStyle = "#000";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (dark(r, c))
      g.fillRect(ox + 14 + (c + quiet) * m, oy + 14 + (r + quiet) * m, m + 0.4, m + 0.4);
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 4; tex.flipY = false;
  return tex;
}

// ---------------------------------------------------------------- heading signs (billboards)
// One atlas row per heading. `section` ties a sign to a page section; `tw` is the
// visual width in world units, `y` the vertical offset. Signs sharing a section stack.
const ROWS = 16, ROW_H = 256, ROW_W = 2048;
const BOARDS = [
  { section: "hero",    text: "NEWLINE",                       tw: 8.2, y: 0.9 },
  { section: "hero",    kind: "year",                          tw: 8.2, y: -0.9 },
  { section: "hero",    kind: "tags",  hi: true,               tw: 5.0, y: -2.1 },
  { section: "when",    text: "28.29.30 MAY 2027",             tw: 7.8, y: 2.6 },
  { section: "what",    text: "SHOW + TELL",                   tw: 6.0, y: 3.6 },
  { section: "what",    text: "FOR HACKERS MAKERS",            tw: 6.4, y: 2.6 },
  { section: "what",    text: "+ TINKERERS",                   tw: 4.4, y: 1.6 },
  { section: "program", text: "PROGRAM",                       tw: 5.5, y: 2.6 },
  { section: "where",   text: "HOW TO GET THERE",              tw: 7.0, y: 2.6 },
  { section: "contact", text: "GET IN TOUCH",                  tw: 6.0, y: 2.6 },
  { section: "end",     text: "END OF TRANSMISSION",           tw: 7.2, y: 0.5 },
  { section: "end",     kind: "tags2", hi: true,               tw: 5.0, y: -0.8 },
];
const NB = BOARDS.length;

function buildBoardAtlas() {
  const cv = document.createElement("canvas");
  cv.width = ROW_W; cv.height = ROWS * ROW_H;
  const g = cv.getContext("2d");
  g.clearRect(0, 0, cv.width, cv.height);
  const F = BLOCKFONT;
  BOARDS.forEach((b, row) => {
    const top = row * ROW_H;
    b.row = row;
    if (b.kind === "year") {
      // [hazard] 2027 [barcode]  spanning the whole row
      const ch = F.fit("2027", 700, 190);
      const tw = F.width("2027", ch), th = F.height(ch);
      const cx = ROW_W / 2 - tw / 2, cy = top + ROW_H / 2 - th / 2;
      F.hazard(g, 40, cy + 10, cx - 90, th - 20, 22);
      F.draw(g, "2027", cx, cy, ch, { outline: 10 });
      F.barcode(g, cx + tw + 60, cy + 10, ROW_W - (cx + tw + 60) - 40, th - 20, 27);
      b.frac = (ROW_W - 80) / ROW_W;
      return;
    }
    if (b.kind === "tags" || b.kind === "tags2") {
      const txt = b.kind === "tags" ? "HSG // 0X20 // SHOW + TELL // FREE ENTRY" : "SEE YOU IN THE VOID // NEWLINE.GENT";
      const ch = F.fit(txt, 1960, 130);
      const tw = F.width(txt, ch), th = F.height(ch);
      F.draw(g, txt, ROW_W / 2 - tw / 2, top + ROW_H / 2 - th / 2, ch, { outline: 6, cut: 0, skew: 0.1 });
      b.frac = tw / ROW_W;
      return;
    }
    const ch = F.fit(b.text, 1880, 200);
    const tw = F.width(b.text, ch), th = F.height(ch);
    F.draw(g, b.text, ROW_W / 2 - tw / 2, top + ROW_H / 2 - th / 2, ch, { outline: 12 });
    b.frac = tw / ROW_W;
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 8; tex.flipY = false;
  return tex;
}

// ---------------------------------------------------------------- shaders (shaders/*.glsl, loaded at startup)
const NS = 12, NBEAM = 5;
const DEFINES = `#define NS ${NS}
#define NB ${NB}
#define NBEAM ${NBEAM}
#define GRID ${GRID}.0
#define ROWS ${ROWS}.0
`;
async function loadShaders() {
  const get = f => fetch("shaders/" + f).then(r => { if (!r.ok) throw new Error(f + " " + r.status); return r.text(); });
  const [common, fog, text, vert] = await Promise.all([get("common.glsl"), get("fog.frag"), get("text.frag"), get("quad.vert")]);
  return { fragFog: DEFINES + common + fog, fragHi: DEFINES + common + text, vert };
}

// ---------------------------------------------------------------- setup
function start({ fragFog, fragHi, vert }) {
  const host = document.getElementById("void");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  } catch (e) {
    document.body.classList.add("nogl");
    return;
  }
  host.appendChild(renderer.domElement);
  const sceneFog = new THREE.Scene(), sceneHi = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const rt = new THREE.WebGLRenderTarget(2, 2, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, stencilBuffer: false });
  const atlas = buildAtlas();
  const board = buildBoardAtlas();

  const signs = [], info = [];
  const SPACING = 13;
  function randomizeSign(i, z) {
    // keep the flight axis clear so panels pass beside the headings, not through the camera
    const side = Math.random() < 0.5 ? -1 : 1;
    signs[i].set(side * (3 + Math.random() * 4.5), (Math.random() - .5) * 8, z, (Math.random() - .5) * 1.1);
    info[i].set(Math.floor(Math.random() * SIGNS.length), Math.random() * 1000, 2.0 + Math.random() * 2.4, 0);
  }
  for (let i = 0; i < NS; i++) { signs.push(new THREE.Vector4()); info.push(new THREE.Vector4()); randomizeSign(i, -12 - i * SPACING); }

  const bill = [], billInfo = [];
  for (let i = 0; i < NB; i++) { bill.push(new THREE.Vector4(0, 0, 1000, 0)); billInfo.push(new THREE.Vector4(BOARDS[i].row, Math.random() * 1000, 1, 1)); }

  const uniforms = {
    uTime: { value: 0 }, uRes: { value: new THREE.Vector2() },
    uCamPos: { value: new THREE.Vector3() }, uCamRot: { value: new THREE.Matrix3() },
    uAtlas: { value: atlas }, uSigns: { value: signs }, uInfo: { value: info },
    uBoard: { value: board }, uBill: { value: bill }, uBillInfo: { value: billInfo },
    uHi: { value: BOARDS.map(b => b.hi ? 1 : 0) },
    uGlitch: { value: 0 }, uDim: { value: 0 }
  };
  const uniformsHi = Object.assign({}, uniforms, { uFog: { value: rt.texture } });   // same value objects, plus the fog texture
  const quad = new THREE.PlaneGeometry(2, 2);
  sceneFog.add(new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: fragFog, depthTest: false, depthWrite: false })));
  sceneHi.add(new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms: uniformsHi, vertexShader: vert, fragmentShader: fragHi, depthTest: false, depthWrite: false })));

  // ---------------------------------------------------------------- scroll → flight
  let boost = 0, lastScrollY = scrollY;
  let milestones = {};

  function measure() {
    const k = UNITS_PER_VH / innerHeight;
    milestones = {};
    document.querySelectorAll("[data-sign]").forEach(el => { milestones[el.dataset.sign] = el.offsetTop * k; });
    milestones.k = k;
  }

  window.addEventListener("scroll", () => {
    const dy = Math.abs(scrollY - lastScrollY); lastScrollY = scrollY;
    boost = Math.min(30, boost + dy * 0.06);
  }, { passive: true });

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(1); renderer.setSize(Math.floor(innerWidth * dpr), Math.floor(innerHeight * dpr), false);
    const w = Math.max(2, Math.floor(innerWidth * FOG_SCALE)), h = Math.max(2, Math.floor(innerHeight * FOG_SCALE));
    rt.setSize(w, h);
    uniforms.uRes.value.set(w, h);
    measure();
  }
  window.addEventListener("resize", resize); resize();
  window.addEventListener("load", measure);
  setTimeout(measure, 1500);

  const euler = new THREE.Euler(), m4 = new THREE.Matrix4();
  let last = performance.now(), t = 0, drift = 0, frames = 0, ftAcc = 0;
  const stat = document.getElementById("stat"), odo = document.getElementById("odo");
  let hidden = document.hidden;
  document.addEventListener("visibilitychange", () => { hidden = document.hidden; last = performance.now(); });

  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;

    boost *= Math.exp(-dt * 1.8);
    t += dt; drift += (BASE_SPEED + boost * 0.4) * dt;
    const scrollDist = scrollY * (milestones.k || 0);
    const dist = drift + scrollDist;

    ftAcc += dt; if (++frames === 40) {
      const ms = ftAcc / frames * 1000;
      if (stat) stat.textContent = `${Math.round(1000 / ms)}FPS ${Math.round(FOG_SCALE * 100)}%`;
      frames = 0; ftAcc = 0;
    }

    const aspect = innerWidth / innerHeight;
    const sf = Math.max(0.3, Math.min(1, aspect / 1.5));   // narrow screens: smaller signs, calmer camera
    const sway = 0.3 + 0.7 * sf;
    const cx = Math.sin(t * 0.31) * 1.1, cy = Math.cos(t * 0.23) * 0.7, cz = -dist;
    uniforms.uCamPos.value.set(cx, cy, cz);
    euler.set(Math.sin(t * 0.4) * 0.03 * sway, Math.cos(t * 0.27) * 0.04 * sway, Math.sin(t * 0.19) * 0.06 * sway);
    m4.makeRotationFromEuler(euler); uniforms.uCamRot.value.setFromMatrix4(m4);
    uniforms.uTime.value = t;
    uniforms.uGlitch.value = boost > 6 ? 0.06 : 0;
    uniforms.uDim.value = 0;

    // heading signs: hang AHEAD units in front of the camera when their section is at the top of the viewport
    for (let i = 0; i < NB; i++) {
      const b = BOARDS[i];
      const ms = milestones[b.section];
      if (ms === undefined) { bill[i].z = 1000; continue; }
      const d = AHEAD + (ms - scrollDist);
      const W = (b.tw / (b.frac || 0.5)) * sf, H = W / 8;
      bill[i].set(cx * (1 - 0.65 * sf * sf) + Math.sin(t * 0.5 + i) * 0.08 * sf, b.y * (0.55 + 0.45 * sf) + Math.sin(t * 0.7 + i * 1.3) * 0.06, cz - d, 0);
      billInfo[i].z = W; billInfo[i].w = H;
    }

    for (let i = 0; i < NS; i++) if (signs[i].z > cz + 1.5) randomizeSign(i, signs[i].z - NS * SPACING);
    if (odo) odo.textContent = "DIST " + String(Math.max(0, Math.floor(dist * 10))).padStart(6, "0");
    renderer.setRenderTarget(rt); renderer.render(sceneFog, cam);
    renderer.setRenderTarget(null); renderer.render(sceneHi, cam);
  }
  requestAnimationFrame(frame);
}

loadShaders().then(start, err => { console.error(err); document.body.classList.add("nogl"); });
