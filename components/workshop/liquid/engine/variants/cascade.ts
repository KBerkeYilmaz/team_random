// PROTOTYPE, never merge. Liquid Pour variant "cascade": the whole hero surface curls
// over its lip into a full-width falling sheet behind the sections.
//
// The sheet is made of ~160 streaky strands (that striation is the techno texture).
// Particles fall with gravity (s^2), so the sheet thins as it drops. 32 lag springs across
// the width take the scroll drag unevenly, so a flick lifts a wavy leading edge that
// settles back. Turbulence grows with depth and scroll speed. Mist kicks up where it
// lands. A centre "veil" dims the column behind the copy so text stays readable.
import * as THREE from "three";

import { NOISE, PARTICLE_COMMON, SPRITE_FRAG } from "../glsl";
import { particleBlending } from "../pool";
import { springConstants } from "../scroll";

import type {
  FrameState,
  Impact,
  PourFocus,
  VariantContext,
  VariantSystem,
} from "./types";

const M = 32;
const STRANDS = 160;

const CASCADE_VERT = /* glsl */ `
${PARTICLE_COMMON}
${NOISE}
attribute vec2 aSeed;          // x: random seed, y: 1 = mist particle
uniform float uLag[${M}];
uniform float uSourceY;
uniform float uLandY;
uniform float uPhase;
uniform float uPour;
uniform float uTurb;
uniform float uVeil;
uniform float uVeilW;
uniform float uMist;
uniform float uSway;
uniform float uThin;
uniform float uSize;
uniform float uFadeIn;

float lagAt(float u) {
  float fu = clamp(u, 0.0, 1.0) * float(${M - 1});
  int i = int(floor(fu));
  int j = min(i + 1, ${M - 1});
  return mix(uLag[i], uLag[j], fu - float(i));
}

void main() {
  float u = position.x;
  float s = fract(position.y + uPhase);
  float layer = position.z;
  float span = max(uLandY - uSourceY, 1.0);
  float x = mix(-0.04, 1.04, u) * uViewport.x + uSway * s * 60.0;
  // Part linear, part gravity: evenly spread enough to read as a curtain, still
  // accelerating (and thinning) toward the pool.
  float fall = s * (0.35 + 0.65 * s);
  float y = uSourceY + span * fall + lagAt(u) * sin(3.14159 * min(s * 1.2, 1.0));
  // Lip curl: the first few percent arc up and over the edge before falling.
  y -= (1.0 - smoothstep(0.0, 0.08, s)) * 10.0 * sin(s / 0.08 * 3.14159);
  float tt = uTime * 0.5 + aSeed.x * 10.0;
  vec2 n = vec2(snoise(vec3(x * 0.006, y * 0.006, tt)), snoise(vec3(x * 0.006 + 17.0, y * 0.006, tt)));
  float speed = 1.0 + min(abs(uVelN), 2.0);
  x += n.x * uTurb * (6.0 + 46.0 * s) * speed;
  y += n.y * uTurb * 12.0 * s;
  // Fade in below the source. form widens this so the falls cross-fade with the hero
  // pool's own particles pouring over its edge (one continuous liquid).
  float alpha = smoothstep(0.0, uFadeIn, s) * (1.0 - smoothstep(0.965, 1.0, s));
  if (aSeed.y > 0.5 && s > 0.78) {
    float k = (s - 0.78) / 0.22;
    y = uLandY - (50.0 + 90.0 * fract(aSeed.x * 5.13)) * sin(k * 3.14159) * uMist;
    x += (aSeed.x - 0.5) * 90.0 * k;
    alpha = 0.55 * (1.0 - k) * step(0.01, uMist);
  }
  float cx = abs(x - uViewport.x * 0.5) / (uViewport.x * 0.5);
  float veil = 1.0 - uVeil * (1.0 - smoothstep(uVeilW * 0.55, uVeilW, cx));
  float front = layer * 0.5 + 0.5;
  float hueN = snoise(vec3(x * 0.002, y * 0.002, uTime * 0.05)) * 0.5 + 0.5;
  float tcol = clamp(0.62 - 0.32 * s + 0.25 * n.x + 0.2 * front, 0.0, 1.0);
  vColor = liquidColor(tcol, hueN, aSeed.x);
  vAlpha = alpha * uPour * veil * mix(0.45, 1.0, front) * (1.0 - uThin * s);
  gl_PointSize = uSize * uSizeScale * uPixelRatio * mix(0.75, 1.25, front);
  gl_Position = toClip(vec2(x, y));
}
`;

export function createCascade(ctx: VariantContext): VariantSystem {
  const capacity = ctx.budget.cascade;
  const data = new Float32Array(capacity * 3);
  const seeds = new Float32Array(capacity * 2);
  for (let i = 0; i < capacity; i++) {
    const strand = Math.floor(Math.random() * STRANDS);
    data[i * 3] = (strand + 0.5 + (Math.random() - 0.5) * 0.22) / STRANDS;
    data[i * 3 + 1] = Math.random();
    data[i * 3 + 2] = Math.random() * 2 - 1;
    seeds[i * 2] = Math.random();
    seeds[i * 2 + 1] = Math.random() < 0.06 ? 1 : 0;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(data, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 2));
  const lag = new Float32Array(M);
  const lagV = new Float32Array(M);
  const weight = Float32Array.from(
    { length: M },
    () => 0.55 + Math.random() * 0.45,
  );
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...ctx.common,
      uLag: { value: lag },
      uSourceY: { value: 0 },
      uLandY: { value: 0 },
      uPhase: { value: 0 },
      uPour: { value: 0 },
      uTurb: { value: 0.35 },
      uVeil: { value: 0.55 },
      uVeilW: { value: 0.42 },
      uMist: { value: 0.7 },
      uSway: { value: 0 },
      uThin: { value: 0.35 },
      uSize: { value: 2.4 },
      uFadeIn: { value: 0.03 },
    },
    vertexShader: CASCADE_VERT,
    fragmentShader: SPRITE_FRAG,
    ...particleBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  let phase = 0;
  let sway = 0;
  let swayV = 0;
  let impactClock = 0;
  let pending: Impact[] = [];
  const focus: PourFocus = {
    x: 0,
    yTop: 0,
    yBottom: 0,
    width: 0,
    intensity: 0,
  };

  return {
    key: "cascade",
    object: points,

    update(f: FrameState) {
      const p = f.params.cascade;
      const L = f.params.common.liquid;
      const span = f.landY - f.sourceY;
      const visible = f.pour > 0.002 && span > 4;
      points.visible = visible;

      if (f.reduced || f.settle) {
        lag.fill(0);
        lagV.fill(0);
        sway = 0;
        swayV = 0;
      } else {
        const drag = f.dy * L.attach;
        for (let m = 0; m < M; m++) lag[m] -= drag * weight[m];
        swayV += f.accN * L.slosh * p.sway * 0.6;
        const { k, c } = springConstants(L.response, L.damping);
        const steps = Math.max(1, Math.ceil(f.dt / (1 / 120)));
        const h = f.dt / steps;
        for (let step = 0; step < steps; step++) {
          for (let m = 0; m < M; m++) {
            lagV[m] += (-k * lag[m] - c * lagV[m]) * h;
            lag[m] += lagV[m] * h;
          }
          swayV += (-k * sway - c * swayV) * h;
          sway += swayV * h;
        }
      }

      phase =
        (phase +
          f.dt * L.flow * 1.5 * (1 + Math.min(3, Math.abs(f.velN)) * 1.2)) %
        1;
      const u = material.uniforms;
      u.uSourceY.value = f.sourceY;
      u.uLandY.value = f.landY;
      u.uPhase.value = phase;
      u.uPour.value = f.pour;
      u.uTurb.value = L.turbulence;
      u.uVeil.value = p.veil;
      u.uVeilW.value = p.veilWidth;
      u.uMist.value = p.mist * f.pour;
      u.uSway.value = sway;
      u.uThin.value = p.thinning;
      u.uFadeIn.value = p.fadeIn ?? 0.03;

      impactClock += f.dt;
      if (visible && impactClock > 0.09) {
        impactClock = 0;
        pending.push({
          x: Math.random() * f.W,
          strength: 0.16 * f.pour * (0.7 + Math.min(1.5, Math.abs(f.velN))),
          radius: 0.022,
        });
      }

      focus.x = f.W / 2;
      // Light gathers where the sheet lands, not mid-air behind the copy.
      focus.yTop = Math.max(f.sourceY, f.landY - f.H * 0.35);
      focus.yBottom = f.landY;
      focus.width = f.W * 0.12;
      focus.intensity = visible ? f.pour * 0.55 : 0;
    },

    focus: () => focus,

    drainImpacts(out: Impact[]) {
      for (const im of pending) out.push(im);
      pending = [];
    },

    setDrawFraction(frac: number) {
      geometry.setDrawRange(0, Math.max(1, Math.floor(capacity * frac)));
    },

    drawn: () =>
      points.visible ? Math.min(capacity, geometry.drawRange.count) : 0,

    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
