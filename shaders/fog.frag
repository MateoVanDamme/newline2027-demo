// Pass 1, rendered at FOG_SCALE resolution: fog, beams, QR panels, big heading signs.
// Alpha = fog transmittance at the small-text sign planes, used by text.frag.
void main(){
  vec3 ro = uCamPos;
  vec3 rd = rayDir();

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
      vec2 cellUV = (vec2(mod(idx, GRID), floor(idx/GRID)) + luv) / GRID;
      float m = texture2D(uAtlas, cellUV).r;
      float flick = 0.75 + 0.25*step(0.08, h11(floor(uTime*30.0) + inf.y));
      sigCol = vec3(m) * (1.9*flick);
      tHit = t; hit = 1.0;
    }
  }

  // big heading signs, blocky like the fog
  for(int i=0;i<NB;i++){
    if (uHi[i] > 0.5) continue;
    vec3 c; float t;
    if (billHit(i, ro, rd, tHit, c, t) > 0.5) { sigCol = c; tHit = t; hit = 1.0; }
  }

  // small text planes: remember where they are so pass 2 can composite against the fog
  float tTag = FAR;
  for(int i=0;i<NB;i++){
    if (uHi[i] < 0.5) continue;
    vec4 s = uBill[i]; vec4 inf = uBillInfo[i];
    float t = (s.z - ro.z) / rd.z;
    if (rd.z >= -1e-4 || t <= 0.05 || t >= tHit) continue;
    vec3 hp = ro + rd*t - s.xyz;
    if (abs(hp.x) < inf.z*0.5 && abs(hp.y) < inf.w*0.5) tTag = min(tTag, t);
  }

  float jit = h12(gl_FragCoord.xy + fract(uTime)*137.0);
  float t = 0.15 + jit*0.25;
  float T = 1.0, acc = 0.0, Tt = 0.0;
  for(int i=0;i<STEPS;i++){
    if (t > tHit || T < 0.02) break;
    if (t >= tTag && Tt == 0.0) Tt = max(T, 0.004);
    vec3 p = ro + rd*t;
    float dens = density(p);
    vec2 b = beams(p);
    float light = (0.03 + b.x) * exp(-b.y*2.5);
    float sl = 0.2 + t*0.05;
    acc += T * dens * light * sl;
    T *= exp(-dens * sl * 0.42);
    t += sl;
  }
  if (tTag < tHit && Tt == 0.0) Tt = max(T, 0.004);
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
  gl_FragColor = vec4(clamp(col,0.0,1.0), Tt);
}
