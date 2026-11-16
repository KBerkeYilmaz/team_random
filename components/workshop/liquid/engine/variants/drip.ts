// PROTOTYPE, never merge. Liquid Pour variant "drip": gooey and discrete.
//
// A glowing liquid film clings to the top edge (the hero pool's lip, then the top of the
// viewport) and travels with you. Up to 9 drips hang from it. Each slowly gathers mass;
// scrolling drags the hanging bulb along with the page, and the underdamped spring
// back overshoots when you stop, so a flick-and-stop stretches drips until they neck and
// detach. Detached droplets fall with gravity (also dragged by the scroll, so they
// linger while you scroll down) and land in the pool with a ripple.
import * as THREE from "three";

import { NOISE, PARTICLE_COMMON, SPRITE_FRAG } from "../glsl";
import { particleBlending } from "../pool";
import { clamp, lerp, springConstants } from "../scroll";

import type {
  FrameState,
  Impact,
  PourFocus,
  VariantContext,
  VariantSystem,
} from "./types";

const MAX_DRIPS = 9;

const DRIP_VERT = /* glsl */ `
${PARTICLE_COMMON}
${NOISE}
attribute vec3 aInfo;          // x: drip slot, y: part (0 neck, 1 bulb, 2 film), z: seed
uniform vec4 uDripA[${MAX_DRIPS}];  // x, filmY, bulbY, bulbR
uniform vec4 uDripB[${MAX_DRIPS}];  // neckR, fallY, dropR, falling
uniform float uDripCount;
uniform float uFilmY;
uniform float uFilmThick;
uniform float uPour;
uniform float uSize;

void main() {
  vec2 pos;
  float alpha = 1.0;
  float tcol;
  float front = position.z * 0.5 + 0.5;
  float seed = aInfo.z;
  if (aInfo.y > 1.5) {
    // Film: a glowing band clinging to the top edge, sagging where drips hang.
    float x = position.x * uViewport.x;
    float wob = snoise(vec3(x * 0.008, uTime * 0.25, 3.0));
    float sag = 0.0;
    for (int k = 0; k < ${MAX_DRIPS}; k++) {
      if (float(k) >= uDripCount) break;
      float dx = (x - uDripA[k].x) / 34.0;
      sag += exp(-dx * dx) * 22.0;
    }
    pos = vec2(x, uFilmY + position.y * (uFilmThick * (0.75 + 0.5 * wob) + sag));
    tcol = 0.5 + 0.4 * (1.0 - position.y);
    alpha = 0.8;
  } else {
    int k = int(aInfo.x);
    vec4 A = uDripA[k];
    vec4 B = uDripB[k];
    bool falling = B.w > 0.5;
    if (aInfo.y < 0.5) {
      // Neck: film -> bulb, pinching in the middle as it stretches.
      float t = position.x;
      float topY = A.y;
      float botY = falling ? A.y + 10.0 : A.z - A.w * 0.6;
      float yy = mix(topY, botY, t);
      float pinch = clamp((botY - topY) / 160.0, 0.0, 0.85);
      // Honey profile: a wide base pulled out of the film, tapering to a pinched
      // neck just above the bulb.
      float R0 = max(A.w, B.x);
      float r = mix(R0 * 1.15, R0 * 0.5, t)
        * (1.0 - pinch * smoothstep(0.25, 0.85, t) * sin(3.14159 * t) * 0.7);
      float wob = snoise(vec3(yy * 0.03, uTime * 0.8, float(k))) * 1.0;
      pos = vec2(A.x + position.y * r + wob, yy);
      tcol = 0.45 + 0.4 * (1.0 - abs(position.y));
    } else {
      // Bulb: hanging under the neck, or the detached droplet in free fall.
      vec2 c = vec2(A.x, falling ? B.y : A.z);
      float R = falling ? B.z : A.w;
      float stretchY = falling ? 1.3 : 1.0 + clamp((A.z - A.y) / 300.0, 0.0, 0.4);
      float wob = snoise(vec3(position.xy * 1.5, uTime * 0.9 + float(k)));
      pos = c + vec2(position.x, position.y * stretchY) * R * (1.0 + 0.05 * wob);
      tcol = 0.55 + 0.45 * (1.0 - length(position.xy));
      alpha = 0.32;
    }
    alpha *= step(float(k) + 0.5, uDripCount);
  }
  float hueN = snoise(vec3(pos * 0.003, uTime * 0.05)) * 0.5 + 0.5;
  vColor = liquidColor(clamp(tcol, 0.0, 1.0), hueN, seed);
  vAlpha = alpha * uPour * mix(0.5, 1.0, front);
  // Bigger, softer sprites inside necks and bulbs so they merge into one smooth drop.
  float partSize = aInfo.y > 1.5 ? 1.0 : (aInfo.y < 0.5 ? 1.35 : 1.8);
  gl_PointSize = uSize * partSize * uSizeScale * uPixelRatio * mix(0.75, 1.25, front);
  gl_Position = toClip(pos);
}
`;

interface Drip {
  seed: number;
  len: number;
  lenV: number;
  target: number;
  r: number;
  falling: boolean;
  fallY: number;
  fallV: number;
  dropR: number;
}

const newDrip = (): Drip => ({
  seed: Math.random(),
  len: 8 + Math.random() * 30,
  lenV: 0,
  target: 12 + Math.random() * 40,
  r: 6,
  falling: false,
  fallY: 0,
  fallV: 0,
  dropR: 0,
});

/** Spread drips across the width, keeping the centre column (the copy) clearer. */
const dripX = (k: number, count: number, seed: number) => {
  const t = count === 1 ? 0.5 : k / (count - 1);
  const base =
    t < 0.5 ? lerp(0.05, 0.36, t / 0.5) : lerp(0.64, 0.95, (t - 0.5) / 0.5);
  return base + (seed - 0.5) * 0.03;
};

export function createDrip(ctx: VariantContext): VariantSystem {
  const capacity = ctx.budget.drip;
  const filmCount = Math.floor(capacity * 0.15);
  const perDrip = Math.floor((capacity - filmCount) / MAX_DRIPS);
  const total = filmCount + perDrip * MAX_DRIPS;
  const data = new Float32Array(total * 3);
  const info = new Float32Array(total * 3);
  let n = 0;
  const push = (
    a: number,
    b: number,
    c: number,
    slot: number,
    part: number,
  ) => {
    data[n * 3] = a;
    data[n * 3 + 1] = b;
    data[n * 3 + 2] = c;
    info[n * 3] = slot;
    info[n * 3 + 1] = part;
    info[n * 3 + 2] = Math.random();
    n++;
  };
  for (let i = 0; i < filmCount; i++) {
    push(
      Math.random(),
      Math.pow(Math.random(), 1.6),
      Math.random() * 2 - 1,
      -1,
      2,
    );
  }
  for (let k = 0; k < MAX_DRIPS; k++) {
    const neck = Math.floor(perDrip * 0.35);
    for (let i = 0; i < perDrip; i++) {
      if (i < neck) {
        const g = (Math.random() + Math.random() + Math.random()) / 1.5 - 1;
        push(Math.random(), g, Math.random() * 2 - 1, k, 0);
      } else {
        const r = Math.sqrt(Math.random());
        const a = Math.random() * Math.PI * 2;
        push(Math.cos(a) * r, Math.sin(a) * r, Math.random() * 2 - 1, k, 1);
      }
    }
  }
  // Shuffle positions and info together so any drawRange prefix is an even subsample.
  const order = Array.from({ length: total }, (_, i) => i);
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const shuffledData = new Float32Array(total * 3);
  const shuffledInfo = new Float32Array(total * 3);
  for (let i = 0; i < total; i++) {
    const src = order[i];
    for (let c = 0; c < 3; c++) {
      shuffledData[i * 3 + c] = data[src * 3 + c];
      shuffledInfo[i * 3 + c] = info[src * 3 + c];
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(shuffledData, 3));
  geometry.setAttribute("aInfo", new THREE.BufferAttribute(shuffledInfo, 3));
  const dripA = Array.from({ length: MAX_DRIPS }, () => new THREE.Vector4());
  const dripB = Array.from({ length: MAX_DRIPS }, () => new THREE.Vector4());
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...ctx.common,
      uDripA: { value: dripA },
      uDripB: { value: dripB },
      uDripCount: { value: 7 },
      uFilmY: { value: 0 },
      uFilmThick: { value: 14 },
      uPour: { value: 0 },
      uSize: { value: 2.4 },
    },
    vertexShader: DRIP_VERT,
    fragmentShader: SPRITE_FRAG,
    ...particleBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const drips = Array.from({ length: MAX_DRIPS }, newDrip);
  let pending: Impact[] = [];
  const focus: PourFocus = {
    x: 0,
    yTop: 0,
    yBottom: 0,
    width: 0,
    intensity: 0,
  };

  return {
    key: "drip",
    object: points,

    update(f: FrameState) {
      const p = f.params.drip;
      const L = f.params.common.liquid;
      const count = clamp(Math.round(p.count), 1, MAX_DRIPS);
      const filmY = clamp(f.sourceY, -6, f.H);
      const visible = f.pour > 0.002 && filmY < f.H - 4;
      points.visible = visible;
      const detachLen = f.H * 0.22 * p.detach;
      const gravity = 1400 * p.gravity;
      // Honey is heavier than the stream: slower response, a touch more overshoot.
      const { k, c } = springConstants(L.response * 1.4, L.damping * 0.8);
      const steps = Math.max(1, Math.ceil(f.dt / (1 / 120)));
      const h = f.dt / steps;
      let lowest = filmY;

      for (let i = 0; i < MAX_DRIPS; i++) {
        const d = drips[i];
        const xPx = dripX(i, count, d.seed) * f.W;
        if (f.reduced || f.settle) {
          d.len = d.target = detachLen * (0.35 + 0.4 * d.seed);
          d.lenV = 0;
          d.falling = false;
        } else if (i < count) {
          if (!d.falling) {
            d.target += f.dt * (14 + 18 * d.seed) * p.growth * f.pour;
            d.len -= f.dy * L.attach * (0.8 + 0.4 * d.seed);
            for (let step = 0; step < steps; step++) {
              d.lenV += (k * (d.target - d.len) - c * d.lenV) * h;
              d.len += d.lenV * h;
            }
            d.len = Math.max(6, d.len);
            if (d.len > detachLen && visible) {
              d.falling = true;
              d.fallY = filmY + d.len;
              d.fallV = Math.max(d.lenV, 80);
              d.dropR = d.r;
              d.len = 8;
              d.lenV = 0;
              d.target = 10 + Math.random() * 16;
            }
          } else {
            d.fallV += gravity * f.dt;
            d.fallY += d.fallV * f.dt - f.dy * L.attach * 0.6;
            if (d.fallY > f.landY || !visible) {
              if (visible) {
                pending.push({
                  x: xPx,
                  strength: 0.45 * (d.dropR / 12),
                  radius: 0.035,
                });
              }
              d.falling = false;
            }
          }
        }
        d.r = Math.min(18, 5 + d.len * 0.07) * p.bulb;
        const bulbY = filmY + d.len;
        lowest = Math.max(lowest, d.falling ? d.fallY : bulbY);
        dripA[i].set(xPx, filmY, bulbY, d.r);
        dripB[i].set(
          3 + d.r * 0.22,
          d.fallY,
          d.dropR * p.bulb,
          d.falling ? 1 : 0,
        );
      }

      const u = material.uniforms;
      u.uDripCount.value = count;
      u.uFilmY.value = filmY;
      u.uFilmThick.value = 20 * p.film;
      u.uPour.value = f.pour;

      focus.x = f.W / 2;
      focus.yTop = filmY;
      focus.yBottom = Math.min(f.H, lowest);
      focus.width = f.W * 0.3;
      focus.intensity = visible ? f.pour * 0.5 : 0;
    },

    focus: () => focus,

    drainImpacts(out: Impact[]) {
      for (const im of pending) out.push(im);
      pending = [];
    },

    setDrawFraction(frac: number) {
      geometry.setDrawRange(0, Math.max(1, Math.floor(total * frac)));
    },

    drawn: () =>
      points.visible ? Math.min(total, geometry.drawRange.count) : 0,

    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
