// PROTOTYPE, never merge. Liquid Pour workshop: the full-screen passes. One background
// pass (base colour + the Lovable-style light fields that ride with the liquid) and one
// final pass (tonemap, vignette, velocity chroma, grain + dither, sRGB out).
import * as THREE from "three";

import { FULLSCREEN_VERT, HASH, NOISE, SRGB } from "./glsl";

export function createFullscreenTriangle(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
  );
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  return g;
}

export const GLOW_COUNT = 6;

const BACKGROUND_FRAG = /* glsl */ `
uniform vec2 uViewport;
uniform float uTime;
uniform float uTheme;
uniform float uGlowGain;
uniform vec3 uBaseD;
uniform vec3 uBaseL;
uniform vec4 uGlowPos[${GLOW_COUNT}];
uniform vec4 uGlowCol[${GLOW_COUNT}];
uniform vec3 uEdgeCol;
uniform float uDots;
uniform float uDotSpacing;
varying vec2 vUv;

${NOISE}

float fbm(vec3 p) {
  float a = 0.5;
  float f = 0.0;
  for (int i = 0; i < 3; i++) {
    f += a * snoise(p);
    p = p * 2.03 + vec3(17.1, 9.2, 3.7);
    a *= 0.5;
  }
  return f;
}

void main() {
  // Screen px, origin top-left, y down (matches the particle shaders).
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uViewport;
  vec2 q = p / uViewport.y * 1.4;
  float t = uTime * 0.025;
  // Domain-warped field: slow, organic variation inside the light, so the glow never
  // reads as a flat CSS radial gradient.
  float warp = fbm(vec3(q + fbm(vec3(q, t)) * 0.9, t * 1.3));

  vec3 base = mix(uBaseD, uBaseL, uTheme);
  vec3 light = vec3(0.0);
  for (int i = 0; i < ${GLOW_COUNT}; i++) {
    vec4 gp = uGlowPos[i];
    vec4 gc = uGlowCol[i];
    if (gc.a <= 0.0) continue;
    vec2 d = (p - gp.xy) / max(gp.zw, vec2(1.0));
    float g = max(exp(-dot(d, d) * 2.0) * (0.75 + 0.5 * warp), 0.0);
    // Real light shifts hue with intensity: the hot core keeps the glow's own orange /
    // amber, the faint tails fall off into deep magenta-red. Dim orange over near-black
    // reads as mud; dim crimson reads as depth.
    vec3 col = mix(uEdgeCol, gc.rgb, smoothstep(0.04, 0.7, g));
    light += col * gc.a * g;
  }
  light *= uGlowGain;
  // LED dot matrix (the user's reference): the light reads through a fine grid of dots
  // (dimmer between them, hot on them, same average), and the base gets a faint lit grid.
  vec2 cell = fract(p / uDotSpacing) - 0.5;
  float dotMask = 1.0 - smoothstep(0.55, 1.15, length(cell) * uDotSpacing);
  light *= mix(1.0, 0.62 + 3.8 * dotMask, uDots);
  base += base * 0.18 * dotMask * uDots * (1.0 - uTheme);
  // Dark: light adds. Light theme: the same field becomes a faint pastel haze of the
  // glow's hue over the porcelain base (never muddy brown).
  vec3 dark = base + light;
  float li = max(light.r, max(light.g, light.b));
  vec3 hue = li > 1e-4 ? light / li : vec3(0.0);
  vec3 pastel = mix(base, hue, 0.45);
  vec3 pale = mix(base, pastel, clamp(li * 1.1, 0.0, 0.75));
  gl_FragColor = vec4(mix(dark, pale, uTheme), 1.0);
}
`;

export function createBackgroundMaterial(
  common: Record<string, THREE.IUniform>,
) {
  const glowPos = Array.from({ length: GLOW_COUNT }, () => new THREE.Vector4());
  const glowCol = Array.from({ length: GLOW_COUNT }, () => new THREE.Vector4());
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uViewport: common.uViewport,
      uTime: common.uTime,
      uTheme: common.uTheme,
      uGlowGain: { value: 1 },
      uBaseD: { value: new THREE.Color() },
      uBaseL: { value: new THREE.Color() },
      uGlowPos: { value: glowPos },
      uGlowCol: { value: glowCol },
      uEdgeCol: { value: new THREE.Color() },
      uDots: { value: 0 },
      uDotSpacing: { value: 5 },
    },
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: BACKGROUND_FRAG,
    depthTest: false,
    depthWrite: false,
  });
  return { material, glowPos, glowCol };
}

const FINAL_FRAG = /* glsl */ `
uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uTime;
uniform float uTheme;
uniform float uExposure;
uniform float uWhite;
uniform float uGrain;
uniform float uVignette;
uniform float uChroma;
uniform float uVelN;
uniform vec3 uBase;
varying vec2 vUv;

${HASH}
${SRGB}

// Hue-preserving extended Reinhard on the max channel, blended a little with the
// per-channel version so the hottest crests warm toward gold instead of clipping.
vec3 tonemap(vec3 c) {
  float m = max(max(c.r, c.g), c.b);
  if (m < 1e-5) return c;
  float w2 = uWhite * uWhite;
  float mm = m * (1.0 + m / w2) / (1.0 + m);
  vec3 huePreserving = c * (mm / m);
  vec3 perChannel = c * (1.0 + c / w2) / (1.0 + c);
  return mix(huePreserving, perChannel, 0.35);
}

void main() {
  // Vertical chromatic split scales with scroll speed: fast flicks smear the light.
  float ca = uChroma * clamp(abs(uVelN), 0.0, 1.0) * 0.006;
  vec3 c = vec3(
    texture2D(uScene, vUv + vec2(0.0, ca)).r,
    texture2D(uScene, vUv).g,
    texture2D(uScene, vUv - vec2(0.0, ca)).b
  );
  // Additive looks: only the light added on top of the base is tonemapped, then screened
  // over it, so a bright base (the vivid orange) stays exactly its colour and light lifts
  // it toward cream instead of the whole frame being compressed.
  vec3 lit = max(c - uBase, 0.0) * uExposure;
  vec3 additive = uBase + (1.0 - uBase) * tonemap(lit);
  c = mix(additive, clamp(c * uExposure, 0.0, 1.0), uTheme);
  vec2 d = vUv - 0.5;
  c *= 1.0 - uVignette * dot(d, d) * 1.6 * mix(1.0, 0.3, uTheme);
  c = linearToSRGB(clamp(c, 0.0, 1.0));
  vec2 px = vUv * uResolution;
  float n1 = hash12(px + fract(uTime * 7.0) * 113.0);
  float n2 = hash12(px * 1.37 + fract(uTime * 5.3) * 71.0);
  c += (n1 - 0.5) * uGrain * mix(1.0, 0.55, uTheme);
  // Triangular dither so the dark gradients don't band.
  c += (n1 + n2 - 1.0) / 255.0;
  gl_FragColor = vec4(c, 1.0);
}
`;

export function createFinalMaterial(common: Record<string, THREE.IUniform>) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uScene: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: common.uTime,
      uTheme: common.uTheme,
      uVelN: common.uVelN,
      uBase: { value: new THREE.Color() },
      uExposure: { value: 1 },
      uWhite: { value: 4 },
      uGrain: { value: 0.05 },
      uVignette: { value: 0.45 },
      uChroma: { value: 0.6 },
    },
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: FINAL_FRAG,
    depthTest: false,
    depthWrite: false,
  });
}
