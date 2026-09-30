// Pass 2, full resolution: only the small text signs (BOARDS with hi: true), composited over pass 1.
uniform sampler2D uFog;
void main(){
  vec4 f = texture2D(uFog, vUv);
  vec3 ro = uCamPos;
  vec3 rd = rayDir();
  vec3 sigCol = vec3(0.0); float hit = 0.0, tHit = FAR;
  for(int i=0;i<NB;i++){
    if (uHi[i] < 0.5) continue;
    vec3 c; float t;
    if (billHit(i, ro, rd, tHit, c, t) > 0.5) { sigCol = c; tHit = t; hit = 1.0; }
  }
  float Tt = f.a;
  vec3 L = (0.25 + 0.75*Tt) * sigCol * hit * step(0.002, Tt);
  // match the fog pass: scanlines on its pixel grid, vignette, dim, frame inversion
  L *= 0.92 + 0.08*step(0.5, fract(floor(vUv.y*uRes.y)*0.5 + 0.25));
  L *= 1.0 - 0.55*dot(vUv-0.5, vUv-0.5)*2.2;
  L *= 1.0 - uDim;
  float inv = step(0.975, h11(floor(uTime*4.0)));
  vec3 col = f.rgb + L * (1.0 - 2.0*inv);
  gl_FragColor = vec4(clamp(col,0.0,1.0), 1.0);
}
