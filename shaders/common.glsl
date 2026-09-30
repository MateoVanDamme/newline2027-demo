// Shared by fog.frag and text.frag. main.js prepends #defines for NS, NB, NBEAM, GRID, ROWS.
precision highp float;
#define STEPS 64
#define FAR 90.0
uniform float uTime; uniform vec2 uRes; uniform vec3 uCamPos; uniform mat3 uCamRot;
uniform sampler2D uAtlas; uniform vec4 uSigns[NS]; uniform vec4 uInfo[NS];
uniform sampler2D uBoard; uniform vec4 uBill[NB]; uniform vec4 uBillInfo[NB]; uniform float uHi[NB];
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
  for(int i=0;i<NBEAM;i++){
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

// camera ray for this pixel, including the row glitch (identical in both passes)
vec3 rayDir(){
  vec2 uv = (vUv*2.0-1.0); uv.x *= uRes.x/uRes.y;
  float row = floor(vUv.y*48.0);
  float gl = h12(vec2(row, floor(uTime*12.0)));
  if (gl > 0.965 - uGlitch) uv.x += (h12(vec2(row, 3.0))-0.5)*0.35;
  return uCamRot * normalize(vec3(uv, -1.45));
}

// heading sign letter test; returns 1 on a letter and sets col / t
float billHit(int i, vec3 ro, vec3 rd, float tHit, out vec3 col, out float t){
  vec4 s = uBill[i]; vec4 inf = uBillInfo[i];
  col = vec3(0.0);
  t = (s.z - ro.z) / rd.z;
  if (rd.z >= -1e-4 || t <= 0.05 || t >= tHit) return 0.0;
  vec3 hp = ro + rd*t - s.xyz;
  if (abs(hp.x) >= inf.z*0.5 || abs(hp.y) >= inf.w*0.5) return 0.0;
  vec2 luv = vec2(hp.x/inf.z + 0.5, -hp.y/inf.w + 0.5);
  float tear = step(0.975, h12(vec2(floor(luv.y*18.0)+inf.y, floor(uTime*13.0))));
  luv.x = fract(luv.x + tear*0.05);
  vec4 m = texture2D(uBoard, vec2(luv.x, (inf.x + luv.y)/ROWS));
  if (m.a < 0.4) return 0.0;
  float flick = 0.8 + 0.2*step(0.06, h11(floor(uTime*28.0) + inf.y));
  float drop = step(0.03, h11(floor(uTime*6.0) + inf.y*3.1));
  col = m.rgb * 2.2 * flick * drop;
  return 1.0;
}
