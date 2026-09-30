// NewLine 2027 — the void
// Raymarched black noise, light beams, random QR signs flying past,
// and the page's headings rendered as block-stencil signs inside the scene.
// Scrolling the page flies the camera forward; each section's sign waits
// ahead in the void and is passed as you scroll through it.

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
  { section: "hero",    kind: "tags",                          tw: 5.0, y: -2.1 },
  { section: "when",    text: "28.29.30 MAY 2027",             tw: 7.8, y: 2.6 },
  { section: "what",    text: "SHOW + TELL",                   tw: 6.0, y: 3.6 },
  { section: "what",    text: "FOR HACKERS MAKERS",            tw: 6.4, y: 2.6 },
  { section: "what",    text: "+ TINKERERS",                   tw: 4.4, y: 1.6 },
  { section: "program", text: "PROGRAM",                       tw: 5.5, y: 2.6 },
  { section: "where",   text: "HOW TO GET THERE",              tw: 7.0, y: 2.6 },
  { section: "contact", text: "GET IN TOUCH",                  tw: 6.0, y: 2.6 },
  { section: "end",     text: "END OF TRANSMISSION",           tw: 7.2, y: 0.5 },
  { section: "end",     kind: "tags2",                         tw: 5.0, y: -0.8 },
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
      const ch = F.fit(txt, 1900, 96);
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

// ---------------------------------------------------------------- shader
const NS = 12, NBEAM = 5;
const frag = `
precision highp float;
#define NS ${NS}
#define NB ${NB}
#define STEPS 64
#define FAR 90.0
uniform float uTime; uniform vec2 uRes; uniform vec3 uCamPos; uniform mat3 uCamRot;
uniform sampler2D uAtlas; uniform vec4 uSigns[NS]; uniform vec4 uInfo[NS];
uniform sampler2D uBoard; uniform vec4 uBill[NB]; uniform vec4 uBillInfo[NB];
uniform float uGlitch; uniform float uDim;
varying vec2 vUv;

float h11(float p){ p=fract(p*0.1031); p*=p+33.33; p*=p+p; return fract(p); }
float h12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float h13(vec3 p3){ p3=fract(p3*0.1031); p3+=dot(p3,p3.zyx+31.32); return fract((p3.x+p3.y)*p3.z); }
float vnoise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x),mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x),mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=0.5,s=0.; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.07+vec3(1.7,9.2,3.1); a*=0.5; } return s; }

float density(vec3 p){
  float d = fbm(p*0.22 + vec3(0.0, uTime*0.04, uTime*0.09));
  d = smoothstep(0.42, 0.78, d) * 0.9;
  float st = step(0.93, h13(floor(p*1.5) + floor(uTime*9.0)*vec3(0.37,0.11,0.53)));
  return 0.04 + d + st*0.6;
}

float lineD(vec3 p, vec3 a, vec3 d){ vec3 q=p-a; return length(q - d*dot(q,d)); }

vec2 beams(vec3 p){
  const float P = 26.0;
  float cell = floor(p.z/P);
  vec3 q = vec3(p.xy, p.z - (cell+0.5)*P);
  float L = 0.0, S = 0.0;
  for(int i=0;i<${NBEAM};i++){
    float fi = float(i);
    float r = h11(cell*7.13 + fi*3.7);
    float ang = r*6.2831 + uTime*(0.25 + 0.2*r)*(mod(fi,2.0)<1.0?1.0:-1.0);
    vec3 a = vec3((h11(r+1.3)-0.5)*9.0, (h11(r+2.9)-0.5)*7.0, (h11(r+4.1)-0.5)*P*0.8);
    vec3 d = normalize(vec3(cos(ang), sin(ang), 0.35*sin(uTime*0.13 + fi)));
    float dist = lineD(q, a, d);
    float flick = 0.7 + 0.3*step(0.2, h11(floor(uTime*24.0) + fi*11.0));
    float b = 0.11/(dist*dist + 0.02) * flick;
    if (i < 3) L += b; else S += b*0.9;
  }
  vec3 r1 = vec3(4.5 + sin(uTime*0.3)*1.5, -2.5, 0.0);
  vec3 r2 = vec3(-5.0, 3.0 + cos(uTime*0.21)*1.2, 0.0);
  float dz = length(p.xy - r1.xy); L += 0.07/(dz*dz + 0.05);
  dz = length(p.xy - r2.xy);       S += 0.05/(dz*dz + 0.05);
  return vec2(L, S);
}

void main(){
  vec2 uv = (vUv*2.0-1.0); uv.x *= uRes.x/uRes.y;
  float row = floor(vUv.y*48.0);
  float gl = h12(vec2(row, floor(uTime*12.0)));
  if (gl > 0.965 - uGlitch) uv.x += (h12(vec2(row, 3.0))-0.5)*0.35;

  vec3 ro = uCamPos;
  vec3 rd = uCamRot * normalize(vec3(uv, -1.45));

  float tHit = FAR; vec3 sigCol = vec3(0.0); float hit = 0.0;

  // random QR / text panels (opaque)
  for(int i=0;i<NS;i++){
    vec4 s = uSigns[i]; vec4 inf = uInfo[i];
    float yaw = s.w;
    vec3 n = vec3(sin(yaw), 0.0, cos(yaw));
    vec3 right = vec3(cos(yaw), 0.0, -sin(yaw));
    float dn = dot(rd, n);
    if (abs(dn) < 1e-4) continue;
    float t = dot(s.xyz - ro, n) / dn;
    if (t <= 0.05 || t >= tHit) continue;
    vec3 hp = ro + rd*t - s.xyz;
    float half_ = inf.z*0.5;
    float u = dot(hp, right), v = hp.y;
    if (abs(u) < half_ && abs(v) < half_){
      vec2 luv = vec2(u, -v)/inf.z + 0.5;
      float tear = step(0.985, h12(vec2(floor(luv.y*24.0)+inf.y, floor(uTime*15.0))));
      luv.x = fract(luv.x + tear*0.08);
      float idx = inf.x;
      vec2 cellUV = (vec2(mod(idx, ${GRID}.0), floor(idx/${GRID}.0)) + luv) / ${GRID}.0;
      float m = texture2D(uAtlas, cellUV).r;
      float flick = 0.75 + 0.25*step(0.08, h11(floor(uTime*30.0) + inf.y));
      sigCol = vec3(m) * (1.9*flick);
      tHit = t; hit = 1.0;
    }
  }

  // heading signs: only the letters exist, the void shows through around them
  for(int i=0;i<NB;i++){
    vec4 s = uBill[i]; vec4 inf = uBillInfo[i];
    float t = (s.z - ro.z) / rd.z;
    if (rd.z >= -1e-4 || t <= 0.05 || t >= tHit) continue;
    vec3 hp = ro + rd*t - s.xyz;
    float u = hp.x, v = hp.y;
    if (abs(u) < inf.z*0.5 && abs(v) < inf.w*0.5){
      vec2 luv = vec2(u/inf.z + 0.5, -v/inf.w + 0.5);
      float tear = step(0.975, h12(vec2(floor(luv.y*18.0)+inf.y, floor(uTime*13.0))));
      luv.x = fract(luv.x + tear*0.05);
      vec4 m = texture2D(uBoard, vec2(luv.x, (inf.x + luv.y)/${ROWS}.0));
      if (m.a < 0.4) continue;
      float flick = 0.8 + 0.2*step(0.06, h11(floor(uTime*28.0) + inf.y));
      // occasional whole-sign dropout, like a dying neon tube
      float drop = step(0.03, h11(floor(uTime*6.0) + inf.y*3.1));
      sigCol = m.rgb * 2.2 * flick * drop;
      tHit = t; hit = 1.0;
    }
  }

  float jit = h12(gl_FragCoord.xy + fract(uTime)*137.0);
  float t = 0.15 + jit*0.25;
  float T = 1.0, acc = 0.0;
  for(int i=0;i<STEPS;i++){
    if (t > tHit || T < 0.02) break;
    vec3 p = ro + rd*t;
    float dens = density(p);
    vec2 b = beams(p);
    float light = (0.03 + b.x) * exp(-b.y*2.5);
    float sl = 0.2 + t*0.05;
    acc += T * dens * light * sl;
    T *= exp(-dens * sl * 0.42);
    t += sl;
  }
  float fog = 1.0 - exp(-acc*3.2);
  vec3 col = vec3(fog) + (0.25 + 0.75*T) * sigCol * hit;

  float inv = step(0.975, h11(floor(uTime*4.0)));
  col = mix(col, 1.0 - col, inv);

  float grain = h12(gl_FragCoord.xy + uTime*61.0);
  col = floor(col*9.0 + grain*0.8)/9.0;
  col *= 0.92 + 0.08*step(0.5, fract(gl_FragCoord.y*0.5));
  float vig = 1.0 - 0.55*dot(vUv-0.5, vUv-0.5)*2.2;
  col *= vig;
  col *= 1.0 - uDim;
  gl_FragColor = vec4(clamp(col,0.0,1.0), 1.0);
}`;
const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// ---------------------------------------------------------------- setup
function start() {
  const host = document.getElementById("void");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  } catch (e) {
    document.body.classList.add("nogl");
    return;
  }
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
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
    uGlitch: { value: 0 }, uDim: { value: 0 }
  };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  // ---------------------------------------------------------------- scroll → flight
  const AHEAD = 6.5;                 // how far ahead a section's sign hangs when the section is on screen
  const UNITS_PER_VH = 22;           // one viewport of scrolling = this many units of flight
  const isSmall = Math.min(innerWidth, innerHeight) < 700;
  let scale = isSmall ? 0.5 : 0.75;
  const BASE_SPEED = 4;
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
    const w = Math.floor(innerWidth * scale), h = Math.floor(innerHeight * scale);
    renderer.setPixelRatio(1); renderer.setSize(w, h, false);
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
      if (ms > 22 && scale > 0.3) { scale -= 0.1; resize(); } else if (ms < 12 && scale < 1) { scale += 0.05; resize(); }
      if (stat) stat.textContent = `${Math.round(1000 / ms)}FPS ${Math.round(scale * 100)}%`;
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
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);
}

start();
