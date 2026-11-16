// PROTOTYPE, never merge. Liquid Pour workshop: a liquid surface made of a perspective
// particle grid. Used twice: the hero "source" pool and the bottom pool that fills up as
// the liquid pours down. A regular grid (lightly jittered) keeps visible rows, which is
// what gives the surface its techno character; perspective spacing compresses the rows
// into a glowing horizon line.
import * as THREE from "three";

import { NOISE, PARTICLE_COMMON, SPRITE_FRAG } from "./glsl";

/**
 * The surface's swell: three directional waves + one octave of simplex noise. Shared with
 * the cup's liquid body so the body's front edge rides exactly the same waves as the
 * surface plane (needs uniform uSeedOffset + the NOISE chunk).
 */
export const SWELL_GLSL = /* glsl */ `
float swell(vec2 P, float t) {
  float h = 0.0;
  h += 0.50 * sin(dot(P, vec2(0.0062, 0.0105)) + t * 1.10);
  h += 0.32 * sin(dot(P, vec2(-0.0128, 0.0071)) + t * 1.65 + 1.3);
  h += 0.20 * sin(dot(P, vec2(0.0205, -0.0158)) + t * 2.35 + 4.1);
  h += 0.45 * snoise(vec3(P * 0.0031, t * 0.21 + uSeedOffset));
  return h;
}
`;

const POOL_VERT = /* glsl */ `
${PARTICLE_COMMON}
${NOISE}
uniform float uHorizonY;
uniform float uNearY;
uniform float uDepth;
uniform float uFarWidth;
uniform float uNearWidth;
uniform float uAmp;
uniform float uAlpha;
uniform float uSwellSpeed;
uniform float uChop;
uniform float uSeedOffset;
uniform float uRippleOn;
uniform float uRippleAmp;
uniform float uColorBias;
uniform float uSize;
uniform float uTilt;
uniform sampler2D uRipple;

${SWELL_GLSL}
void main() {
  float u = position.x;   // -1..1 across
  float v = position.y;   // 0 = near edge, 1 = horizon
  float seed = position.z;
  float d = mix(1.0, uDepth, v);
  float s = 1.0 / d;
  float sn = (s - 1.0 / uDepth) / (1.0 - 1.0 / uDepth);   // screen fraction: 1 near, 0 horizon
  vec2 P = vec2(u * uViewport.x * 0.9, d * uViewport.x * 0.16);
  float t = uTime * uSwellSpeed;
  float h0 = swell(P, t);
  float hx = swell(P + vec2(8.0, 0.0), t);
  float hz = swell(P + vec2(0.0, 8.0), t);
  float rip = 0.0;
  if (uRippleOn > 0.5) rip = texture2D(uRipple, vec2(u * 0.5 + 0.5, v)).r * uRippleAmp;
  float chop = 1.0 + uChop * min(abs(uVelN), 2.0);
  float height = (h0 * chop + rip) * uAmp;
  float slope = length(vec2(hx - h0, hz - h0)) / 8.0;
  float lateral = mix(uFarWidth, uNearWidth, sn);
  float x = uViewport.x * 0.5 + u * uViewport.x * 0.5 * lateral;
  float y = mix(uHorizonY, uNearY, sn) - height * mix(0.25, 1.0, sn);
  y += uTilt * (x - uViewport.x * 0.5) * mix(0.35, 1.0, sn);
  float crest = clamp(0.5 + 0.3 * (h0 + rip) + slope * 40.0, 0.0, 1.0);
  float hueN = snoise(vec3(P * 0.0018, uTime * 0.04 + uSeedOffset)) * 0.5 + 0.5;
  vColor = liquidColor(clamp(crest * 0.85 + uColorBias, 0.0, 1.0), hueN, seed);
  float edge = smoothstep(1.0, 0.8, abs(u));
  // Keep the far rows alive: their perspective crowding is what draws the glowing
  // horizon line.
  float horizonFade = 0.35 + 0.65 * smoothstep(0.0, 0.12, sn);
  vAlpha = uAlpha * edge * horizonFade * mix(0.5, 1.0, sn) * (0.55 + 0.45 * crest);
  gl_PointSize = uSize * uSizeScale * uPixelRatio * mix(0.45, 1.25, sn) * (0.85 + 0.5 * crest);
  gl_Position = toClip(vec2(x, y));
}
`;

export interface PoolFrame {
  horizonY: number;
  nearY: number;
  alpha: number;
  amp: number;
  depth: number;
  farWidth: number;
  nearWidth: number;
  swellSpeed: number;
  chop: number;
  size: number;
  colorBias: number;
  ripple: THREE.Texture | null;
  rippleAmp: number;
  /** Surface slope in px per px (cup slosh). Optional, defaults to 0. */
  tilt?: number;
}

export class PoolSystem {
  readonly points: THREE.Points;
  readonly capacity: number;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.ShaderMaterial;

  constructor(
    common: Record<string, THREE.IUniform>,
    cols: number,
    rows: number,
    seedOffset: number,
  ) {
    this.capacity = cols * rows;
    const data = new Float32Array(this.capacity * 3);
    let k = 0;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const ju = (Math.random() - 0.5) * 0.3;
        const jv = (Math.random() - 0.5) * 0.3;
        data[k++] = -1 + (2 * (i + 0.5 + ju)) / cols;
        data[k++] = Math.pow((j + 0.5 + jv) / rows, 1.12);
        data[k++] = Math.random();
      }
    }
    shuffleTriples(data);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(data, 3));
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        ...common,
        uHorizonY: { value: 0 },
        uNearY: { value: 0 },
        uDepth: { value: 7 },
        uFarWidth: { value: 1.15 },
        uNearWidth: { value: 2.2 },
        uAmp: { value: 14 },
        uAlpha: { value: 1 },
        uSwellSpeed: { value: 1 },
        uChop: { value: 0.6 },
        uSeedOffset: { value: seedOffset },
        uRippleOn: { value: 0 },
        uRippleAmp: { value: 1 },
        uColorBias: { value: 0 },
        uSize: { value: 2.6 },
        uTilt: { value: 0 },
        uRipple: { value: null },
      },
      vertexShader: POOL_VERT,
      fragmentShader: SPRITE_FRAG,
      ...particleBlending,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  set(frame: PoolFrame): void {
    const u = this.material.uniforms;
    u.uHorizonY.value = frame.horizonY;
    u.uNearY.value = frame.nearY;
    u.uAlpha.value = frame.alpha;
    u.uAmp.value = frame.amp;
    u.uDepth.value = frame.depth;
    u.uFarWidth.value = frame.farWidth;
    u.uNearWidth.value = frame.nearWidth;
    u.uSwellSpeed.value = frame.swellSpeed;
    u.uChop.value = frame.chop;
    u.uSize.value = frame.size;
    u.uColorBias.value = frame.colorBias;
    u.uRipple.value = frame.ripple;
    u.uRippleOn.value = frame.ripple ? 1 : 0;
    u.uRippleAmp.value = frame.rippleAmp;
    u.uTilt.value = frame.tilt ?? 0;
    this.points.visible = frame.alpha > 0.002;
  }

  setDrawFraction(frac: number): void {
    this.geometry.setDrawRange(
      0,
      Math.max(1, Math.floor(this.capacity * frac)),
    );
  }

  drawn(): number {
    if (!this.points.visible) return 0;
    return Math.min(this.capacity, this.geometry.drawRange.count);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

/** Premultiplied blend shared by every particle material (see SPRITE_FRAG). */
export const particleBlending = {
  transparent: true,
  depthTest: false,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,
  blendEquationAlpha: THREE.AddEquation,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
} as const;

/** Fisher-Yates over packed triples, so any prefix (drawRange) is an even subsample. */
export function shuffleTriples(a: Float32Array): void {
  const n = a.length / 3;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    for (let c = 0; c < 3; c++) {
      const t = a[i * 3 + c];
      a[i * 3 + c] = a[j * 3 + c];
      a[j * 3 + c] = t;
    }
  }
}
