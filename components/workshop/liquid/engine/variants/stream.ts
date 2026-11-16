// PROTOTYPE, never merge. Liquid Pour variant "stream": one thick honey column.
//
// CPU: a 64-node spine from the hero pool's lip (or just above the viewport) to the
// bottom pool. Each node springs toward a rest line that weaves between sections. Every
// scroll frame drags the nodes along with the page (attach), so the column lags,
// stretches and wobbles, then catches up. Scroll acceleration adds an S-shaped slosh.
// GPU: particles flow down the spine (Catmull-Rom over 4 nodes) inside a round
// cross-section. Width thins where the spine stretches (width ~ 1/sqrt(stretch)) and
// swells into a drop-shaped head that splashes into the pool.
import { createNoise2D } from "simplex-noise";
import * as THREE from "three";

import { NOISE, PARTICLE_COMMON, SPRITE_FRAG } from "../glsl";
import type { StreamParams } from "../params";
import { particleBlending } from "../pool";
import {
  clamp,
  lerp,
  smoothstep,
  springConstants,
  type SectionMetrics,
} from "../scroll";

import type {
  FrameState,
  Impact,
  PourFocus,
  VariantContext,
  VariantSystem,
} from "./types";

const N = 64;

const STREAM_VERT = /* glsl */ `
${PARTICLE_COMMON}
${NOISE}
attribute vec2 aSeed;          // x: random seed, y: 1 = splash particle
uniform vec4 uSpine[${N}];     // xy: node (screen px), z: width (px), w: stretch
uniform float uPhase;
uniform float uPour;
uniform float uTurb;
uniform float uSplash;
uniform float uSize;
uniform vec2 uLand;

vec2 cr(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
  float t2 = t * t;
  float t3 = t2 * t;
  return 0.5 * ((2.0 * p1) + (-p0 + p2) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2
    + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3);
}

vec2 crd(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
  float t2 = t * t;
  return 0.5 * ((-p0 + p2) + 2.0 * (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t
    + 3.0 * (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t2);
}

void main() {
  float s = fract(position.x + uPhase);
  float fi = s * float(${N - 1});
  int i = int(floor(fi));
  float f = fi - float(i);
  vec4 a = uSpine[max(i - 1, 0)];
  vec4 b = uSpine[i];
  vec4 c = uSpine[min(i + 1, ${N - 1})];
  vec4 d = uSpine[min(i + 2, ${N - 1})];
  vec2 P = cr(a.xy, b.xy, c.xy, d.xy, f);
  vec2 T = crd(a.xy, b.xy, c.xy, d.xy, f);
  float tl = length(T);
  T = tl > 1e-4 ? T / tl : vec2(0.0, 1.0);
  vec2 nrm = vec2(-T.y, T.x);
  float width = mix(b.z, c.z, f) * (1.0 + 0.55 * smoothstep(0.84, 1.0, s));
  float r = position.y;          // 0 centre .. 1 skin
  float th = position.z;
  float lat = cos(th) * r;
  float dep = sin(th) * r;       // -1 back .. 1 front
  float tn = uTime * 0.6 + aSeed.x * 20.0;
  vec2 turb = vec2(snoise(vec3(P * 0.012, tn)), snoise(vec3(P * 0.012 + 31.7, tn)))
    * uTurb * width * 0.35;
  vec2 pos = P + nrm * lat * width * 0.5 + turb;
  float alpha = smoothstep(0.0, 0.025, s) * (1.0 - smoothstep(0.97, 1.0, s));
  if (aSeed.y > 0.5 && s > 0.84) {
    // Splash crown: ballistic arcs out of the landing point.
    float k = (s - 0.84) / 0.16;
    float ang = (aSeed.x - 0.5) * 2.6;
    float speed = (70.0 + 110.0 * fract(aSeed.x * 7.31)) * uSplash;
    pos = uLand + vec2(sin(ang), -cos(ang)) * speed * k + vec2(0.0, 220.0) * k * k;
    alpha = (1.0 - k) * 0.9 * step(0.01, uSplash);
  }
  // Honey: orange skin, amber-to-gold core, only a whisper of the magenta drift.
  float core = 1.0 - r;
  float hueN = (snoise(vec3(P * 0.004, uTime * 0.05)) * 0.5 + 0.5) * 0.45;
  float tcol = clamp(0.38 + 0.55 * core + 0.12 * snoise(vec3(P * 0.02, uTime * 0.3)), 0.0, 1.0);
  vColor = liquidColor(tcol, hueN, aSeed.x);
  float front = dep * 0.5 + 0.5;
  vAlpha = alpha * uPour * mix(0.45, 1.0, front);
  gl_PointSize = uSize * uSizeScale * uPixelRatio * mix(0.75, 1.3, front);
  gl_Position = toClip(pos);
}
`;

export function createStream(ctx: VariantContext): VariantSystem {
  const capacity = ctx.budget.stream;
  const data = new Float32Array(capacity * 3);
  const seeds = new Float32Array(capacity * 2);
  for (let i = 0; i < capacity; i++) {
    data[i * 3] = Math.random();
    data[i * 3 + 1] = Math.sqrt(Math.random());
    data[i * 3 + 2] = Math.random() * Math.PI * 2;
    seeds[i * 2] = Math.random();
    seeds[i * 2 + 1] = Math.random() < 0.08 ? 1 : 0;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(data, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 2));
  const spine = Array.from({ length: N }, () => new THREE.Vector4());
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...ctx.common,
      uSpine: { value: spine },
      uPhase: { value: 0 },
      uPour: { value: 0 },
      uTurb: { value: 0.35 },
      uSplash: { value: 1 },
      uSize: { value: 2.8 },
      uLand: { value: new THREE.Vector2() },
    },
    vertexShader: STREAM_VERT,
    fragmentShader: SPRITE_FRAG,
    ...particleBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const noise2D = createNoise2D();
  const x = new Float32Array(N);
  const y = new Float32Array(N);
  const vx = new Float32Array(N);
  const vy = new Float32Array(N);
  const rx = new Float32Array(N);
  const ry = new Float32Array(N);
  const anchorY = new Float32Array(4);
  const anchorX = new Float32Array(4);
  let ready = false;
  let phase = 0;
  let impactClock = 0;
  let pending: Impact[] = [];
  const focus: PourFocus = {
    x: 0,
    yTop: 0,
    yBottom: 0,
    width: 0,
    intensity: 0,
  };

  const setAnchors = (s: SectionMetrics, p: StreamParams) => {
    anchorY[0] = (s.heroTop + s.heroBottom) / 2;
    anchorY[1] = (s.aboutTop + s.aboutBottom) / 2;
    anchorY[2] = (s.servicesTop + s.servicesBottom) / 2;
    anchorY[3] = (s.ctaTop + s.ctaBottom) / 2;
    anchorX[0] = p.xHero;
    anchorX[1] = p.xAbout;
    anchorX[2] = p.xServices;
    anchorX[3] = p.xCta;
  };

  /** The "riverbed": where the column wants to be at a document y, between sections. */
  const riverX = (docY: number) => {
    if (docY <= anchorY[0]) return anchorX[0];
    for (let i = 0; i < 3; i++) {
      if (docY <= anchorY[i + 1]) {
        return lerp(
          anchorX[i],
          anchorX[i + 1],
          smoothstep(anchorY[i], anchorY[i + 1], docY),
        );
      }
    }
    return anchorX[3];
  };

  return {
    key: "stream",
    object: points,

    update(f: FrameState) {
      const p = f.params.stream;
      const L = f.params.common.liquid;
      const span = f.landY - f.sourceY;
      const visible = f.pour > 0.002 && span > 4;
      points.visible = visible;
      setAnchors(f.sections, p);
      // Where the column wants to be for the section in the middle of the screen.
      const centreX = riverX(f.scrollY + f.H * 0.5);

      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const yy = f.sourceY + span * t;
        const meander =
          p.meander * Math.sin(Math.PI * t) * noise2D(t * 1.7, f.t * 0.15);
        const along = riverX(f.scrollY + yy);
        rx[i] = (centreX + (along - centreX) * p.bend) * f.W + meander;
        ry[i] = yy;
      }

      if (!ready || f.reduced || f.settle) {
        x.set(rx);
        y.set(ry);
        vx.fill(0);
        vy.fill(0);
        ready = true;
      } else {
        // Honey lag: the page drags the column along, springs pull it back.
        const drag = f.dy * L.attach;
        const slosh = f.accN * L.slosh * f.W * 0.0035;
        for (let i = 1; i < N - 1; i++) {
          const t = i / (N - 1);
          const w = Math.pow(Math.sin(Math.PI * t), 0.7);
          y[i] -= drag * w;
          vx[i] += slosh * w * Math.sin(t * Math.PI * 2 + 0.6);
        }
        const { k, c } = springConstants(L.response, L.damping);
        const steps = Math.max(1, Math.ceil(f.dt / (1 / 120)));
        const h = f.dt / steps;
        for (let step = 0; step < steps; step++) {
          for (let i = 0; i < N; i++) {
            const end = i === 0 || i === N - 1;
            const kk = end ? k * 6 : k;
            const cc = end ? c * 2.4 : c;
            vx[i] += (kk * (rx[i] - x[i]) - cc * vx[i]) * h;
            vy[i] += (kk * (ry[i] - y[i]) - cc * vy[i]) * h;
            x[i] += vx[i] * h;
            y[i] += vy[i] * h;
          }
        }
      }

      const restSeg = Math.max(1, Math.abs(span) / (N - 1));
      const baseW = p.width * Math.sqrt(f.pour);
      for (let i = 0; i < N; i++) {
        const j = Math.min(i, N - 2);
        const seg = Math.hypot(x[j + 1] - x[j], y[j + 1] - y[j]);
        const stretch = seg / restSeg;
        const w =
          baseW * clamp(1 / Math.sqrt(Math.max(0.05, stretch)), 0.4, 1.8);
        spine[i].set(x[i], y[i], w, stretch);
      }

      phase =
        (phase + f.dt * L.flow * (1 + Math.min(3, Math.abs(f.velN)) * 1.2)) % 1;
      const u = material.uniforms;
      u.uPhase.value = phase;
      u.uPour.value = f.pour;
      u.uTurb.value = L.turbulence;
      u.uSplash.value = p.splash * f.pour;
      (u.uLand.value as THREE.Vector2).set(x[N - 1], y[N - 1]);

      impactClock += f.dt;
      if (visible && impactClock > 0.14) {
        impactClock = 0;
        pending.push({
          x: x[N - 1],
          strength: 0.35 * f.pour * (0.7 + Math.min(1.5, Math.abs(f.velN))),
          radius: 0.03,
        });
      }

      focus.x = x[Math.floor(N * 0.6)];
      focus.yTop = Math.max(-f.H * 0.1, y[0]);
      focus.yBottom = y[N - 1];
      focus.width = baseW;
      focus.intensity = visible ? f.pour : 0;
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
