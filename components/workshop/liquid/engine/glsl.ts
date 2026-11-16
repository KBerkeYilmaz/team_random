// PROTOTYPE, never merge. Liquid Pour workshop: shared GLSL chunks, kept as plain strings
// so next.config.mjs needs no shader loader. three.js compiles ShaderMaterial as
// GLSL ES 3.00 on WebGL2 (it maps attribute/varying/texture2D/gl_FragColor for us), so
// dynamic uniform-array indexing is available in the vertex shaders.

/**
 * 3D simplex noise. Classic implementation by Ian McEwan / Ashima Arts and Stefan
 * Gustavson (MIT licence, https://github.com/ashima/webgl-noise). Returns roughly [-1, 1].
 */
export const NOISE = /* glsl */ `
vec3 lwMod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 lwMod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 lwPermute(vec4 x) { return lwMod289(((x * 34.0) + 1.0) * x); }
vec4 lwTaylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = lwMod289(i);
  vec4 p = lwPermute(lwPermute(lwPermute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
    i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
    i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = lwTaylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

/** Sin-free hash (Dave Hoskins, "Hash without Sine", MIT). Stable on mobile GPUs. */
export const HASH = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

/**
 * Everything a particle vertex shader shares: viewport/pixel-ratio/time/theme uniforms,
 * the dark + light palette ramps, a hue rotation for per-particle jitter, and the
 * screen-px -> clip-space mapping (screen px, origin top-left, y down).
 */
export const PARTICLE_COMMON = /* glsl */ `
uniform vec2 uViewport;
uniform float uPixelRatio;
uniform float uTime;
uniform float uTheme;
uniform float uVelN;
uniform vec3 uRampD[4];
uniform vec3 uAccentD;
uniform vec3 uRampL[4];
uniform vec3 uAccentL;
uniform float uHueDrift;
uniform float uJitter;
uniform float uSizeScale;
uniform float uGlowGain;

varying vec3 vColor;
varying float vAlpha;

vec3 lwRamp(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.4) return mix(a, b, t / 0.4);
  if (t < 0.75) return mix(b, c, (t - 0.4) / 0.35);
  return mix(c, d, (t - 0.75) / 0.25);
}

vec3 lwHueShift(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}

// t: 0 = cool edge/trough, 1 = hot crest/core. hueN: 0..1 magenta drift amount.
vec3 liquidColor(float t, float hueN, float seed) {
  vec3 dc = lwRamp(uRampD[0], uRampD[1], uRampD[2], uRampD[3], t);
  dc = mix(dc, uAccentD, clamp(hueN, 0.0, 1.0) * uHueDrift);
  vec3 lc = lwRamp(uRampL[0], uRampL[1], uRampL[2], uRampL[3], t);
  lc = mix(lc, uAccentL, clamp(hueN, 0.0, 1.0) * uHueDrift);
  vec3 c = mix(dc * uGlowGain, lc, uTheme);
  return max(lwHueShift(c, (seed - 0.5) * 2.0 * uJitter), 0.0);
}

vec4 toClip(vec2 p) {
  return vec4(p.x / uViewport.x * 2.0 - 1.0, 1.0 - p.y / uViewport.y * 2.0, 0.0, 1.0);
}
`;

/**
 * One fragment shader for every particle system. Output is premultiplied; the material
 * blends with (ONE, ONE_MINUS_SRC_ALPHA). Writing alpha = a * uTheme makes the same blend
 * behave additively in dark (alpha 0 -> pure light accumulation) and as normal "ink"
 * compositing in light (alpha a), so the theme crossfades with no blend-mode switch.
 */
export const SPRITE_FRAG = /* glsl */ `
uniform float uTheme;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 pc = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(pc, pc);
  if (r2 > 1.0) discard;
  float glow = exp(-r2 * 4.0) + 0.3 * exp(-r2 * 1.4);
  float ink = smoothstep(1.0, 0.35, r2);
  float a = mix(glow, ink, uTheme) * vAlpha;
  gl_FragColor = vec4(vColor * a, a * uTheme);
}
`;

export const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const SRGB = /* glsl */ `
vec3 linearToSRGB(vec3 c) {
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(vec3(0.0031308), c));
}
`;
