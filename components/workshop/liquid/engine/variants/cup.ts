// PROTOTYPE, never merge. Liquid workshop variant "cup": the screen is a glass filled with
// glowing particle liquid (the direction the user picked after round 1: "think of like a
// filled cup").
//
// - The liquid lives in the viewport, so it is always with you: it is in your cup.
// - Its level rises as you go down the page (fillStart -> fillEnd).
// - Scrolling moves the cup; the liquid's inertia makes it heave (attach drag + spring,
//   critically-ish damped so it settles with one soft rebound), and scroll acceleration
//   rocks it into a side-to-side slosh. Fast heaves slap waves off both walls into the
//   surface ripple tank, which then run, interfere and fade.
// - What you see: the top surface as a perspective plane of particle rows (the hero pool
//   from round 1, reused), its front edge as a bright meniscus, and the liquid body below
//   it, glowing hot at the surface and falling off into deep crimson, with slow drift and
//   rising bubbles. The body samples the plane's own swell + ripple at the front edge, so
//   the two always meet exactly.
import { createNoise2D } from "simplex-noise";
import * as THREE from "three";

import { NOISE, PARTICLE_COMMON, SPRITE_FRAG } from "../glsl";
import { PoolSystem, SWELL_GLSL, particleBlending } from "../pool";
import { clamp, lerp, smoothstep, springConstants } from "../scroll";

import type {
  FrameState,
  GlowSpec,
  PourFocus,
  VariantContext,
  VariantSystem,
} from "./types";

const NEAR_WIDTH = 1.3;
const FAR_WIDTH = 1.05;
const PLANE_DEPTH = 5;
const SEED = 3.1;

const BODY_VERT = /* glsl */ `
${PARTICLE_COMMON}
${NOISE}
uniform float uSeedOffset;
${SWELL_GLSL}
attribute vec2 aInfo;          // x: kind (0 body, 1 meniscus, 2 bubble), y: seed
uniform float uLevelY;
uniform float uHeave;
uniform float uTilt;
uniform float uAmp;
uniform float uSwellSpeed;
uniform float uChop;
uniform float uRippleOn;
uniform float uRippleAmp;
uniform sampler2D uRipple;
uniform float uNearWidth;
uniform float uMeniscus;
uniform float uBubbles;
uniform float uSize;

// The surface plane's front edge, evaluated exactly like its near row in POOL_VERT.
float surfaceY(float x) {
  float u = (x - uViewport.x * 0.5) / (uViewport.x * 0.5 * uNearWidth);
  vec2 P = vec2(u * uViewport.x * 0.9, uViewport.x * 0.16);
  float chop = 1.0 + uChop * min(abs(uVelN), 2.0);
  float rip = 0.0;
  if (uRippleOn > 0.5) {
    rip = texture2D(uRipple, vec2(clamp(u * 0.5 + 0.5, 0.0, 1.0), 0.0)).r * uRippleAmp;
  }
  float height = (swell(P, uTime * uSwellSpeed) * chop + rip) * uAmp;
  return uLevelY + uHeave + uTilt * (x - uViewport.x * 0.5) - height;
}

void main() {
  float kind = aInfo.x;
  float seed = aInfo.y;
  float front = position.z * 0.5 + 0.5;
  float x = mix(-0.03, 1.03, position.x) * uViewport.x;
  float sy = surfaceY(x);
  float bottom = uViewport.y + 30.0;
  float y;
  float alpha;
  float tcol;
  float size = 1.0;
  if (kind > 1.5) {
    // Bubbles: rise from the deep to the surface, wobbling, and vanish into it.
    float k = fract(seed * 7.13 + uTime * (0.035 + 0.05 * fract(seed * 3.7)));
    y = mix(bottom, sy + 4.0, k);
    x += sin(uTime * 2.0 + seed * 40.0) * 3.0 * (1.0 - k);
    alpha = uBubbles * smoothstep(0.0, 0.15, k) * (1.0 - smoothstep(0.86, 1.0, k)) * 0.9;
    tcol = 0.55 + 0.35 * k;
    size = 0.9 + 0.6 * fract(seed * 11.0);
  } else if (kind > 0.5) {
    // Meniscus: the bright band riding the front edge.
    y = sy + position.y * 9.0;
    alpha = uMeniscus * 0.85;
    tcol = 0.85 + 0.15 * (1.0 - position.y);
    size = 1.25;
  } else {
    // Body: dense and hot near the surface, sparse and deep crimson below.
    float d = position.y;
    float depthPx = max(bottom - sy, 1.0);
    float drift = uTime * 0.05;
    vec2 n = vec2(
      snoise(vec3(x * 0.004, d * 3.0, drift + seed)),
      snoise(vec3(x * 0.004 + 9.0, d * 3.0, drift))
    );
    x += n.x * 14.0 * d;
    y = sy + 2.0 + d * depthPx + n.y * 8.0 * d;
    float lit = pow(1.0 - d, 1.6);
    alpha = mix(0.08, 0.9, lit);
    tcol = 0.12 + 0.78 * lit;
  }
  float hueN = snoise(vec3(x * 0.002, y * 0.003, uTime * 0.04)) * 0.5 + 0.5;
  vColor = liquidColor(clamp(tcol, 0.0, 1.0), hueN, seed);
  vAlpha = alpha * mix(0.55, 1.0, front);
  gl_PointSize = uSize * size * uSizeScale * uPixelRatio * mix(0.75, 1.2, front);
  gl_Position = toClip(vec2(x, y));
}
`;

export function createCup(ctx: VariantContext): VariantSystem {
  const capacity = ctx.budget.cup;
  const data = new Float32Array(capacity * 3);
  const info = new Float32Array(capacity * 2);
  const K = 3.2; // body density falls off as exp(-K * depth)
  for (let i = 0; i < capacity; i++) {
    const r = Math.random();
    const kind = r < 0.12 ? 1 : r < 0.16 ? 2 : 0;
    data[i * 3] = Math.random();
    data[i * 3 + 1] =
      kind === 0
        ? -Math.log(1 - Math.random() * (1 - Math.exp(-K))) / K
        : Math.random();
    data[i * 3 + 2] = Math.random() * 2 - 1;
    info[i * 2] = kind;
    info[i * 2 + 1] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(data, 3));
  geometry.setAttribute("aInfo", new THREE.BufferAttribute(info, 2));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...ctx.common,
      uSeedOffset: { value: SEED },
      uLevelY: { value: 0 },
      uHeave: { value: 0 },
      uTilt: { value: 0 },
      uAmp: { value: 22 },
      uSwellSpeed: { value: 1 },
      uChop: { value: 0.6 },
      uRippleOn: { value: 0 },
      uRippleAmp: { value: 1 },
      uRipple: { value: null },
      uNearWidth: { value: NEAR_WIDTH },
      uMeniscus: { value: 1 },
      uBubbles: { value: 0.6 },
      uSize: { value: 2.4 },
    },
    vertexShader: BODY_VERT,
    fragmentShader: SPRITE_FRAG,
    ...particleBlending,
  });
  const body = new THREE.Points(geometry, material);
  body.frustumCulled = false;
  body.renderOrder = 1;

  const plane = new PoolSystem(
    ctx.common,
    ctx.budget.topPool[0],
    Math.round(ctx.budget.topPool[1] * 0.7),
    SEED,
  );
  plane.points.renderOrder = 0;

  const group = new THREE.Group();
  group.add(plane.points, body);

  const noise2D = createNoise2D();
  const rampD = ctx.common.uRampD.value as THREE.Color[];
  const surfaceColor = new THREE.Color();
  const deepColor = new THREE.Color();
  const flareColor = new THREE.Color();
  let ready = false;
  let levelY = 0;
  let levelV = 0;
  let heave = 0;
  let heaveV = 0;
  let tilt = 0;
  let tiltV = 0;
  let splashClock = 0;
  let W = 1;
  let H = 1;
  let bodyGlow = 1;
  let drawFrac = 1;
  const focus: PourFocus = {
    x: 0,
    yTop: 0,
    yBottom: 0,
    width: 0,
    intensity: 0,
  };

  return {
    key: "cup",
    object: group,
    ownsScene: true,

    update(f: FrameState) {
      const p = f.params.cup;
      const L = f.params.common.liquid;
      const P = f.params.common.pools;
      W = f.W;
      H = f.H;
      bodyGlow = p.bodyGlow;
      const fill = lerp(p.fillStart, p.fillEnd, smoothstep(0, 1, f.progress));
      const targetY = f.H * (1 - fill);

      if (!ready || f.reduced || f.settle) {
        levelY = targetY;
        levelV = heave = heaveV = tilt = tiltV = 0;
        ready = true;
      } else {
        // The cup moves with the scroll; the liquid's inertia lifts it, the spring settles it.
        heave -= f.dy * L.attach * 0.35 * p.heave;
        // Scroll acceleration rocks it sideways; the direction wanders slowly so repeated
        // flicks don't always tip the same way.
        const dir = Math.tanh(noise2D(f.t * 0.11, 7.7) * 3);
        tiltV += f.accN * L.slosh * 0.02 * p.heave * dir;
        const lvl = springConstants(L.response * 2, 1);
        const hv = springConstants(L.response, L.damping);
        const tl = springConstants(L.response * 1.6, L.damping * 0.7);
        const steps = Math.max(1, Math.ceil(f.dt / (1 / 120)));
        const h = f.dt / steps;
        for (let s = 0; s < steps; s++) {
          levelV += (lvl.k * (targetY - levelY) - lvl.c * levelV) * h;
          levelY += levelV * h;
          heaveV += (-hv.k * heave - hv.c * heaveV) * h;
          heave += heaveV * h;
          tiltV += (-tl.k * tilt - tl.c * tiltV) * h;
          tilt += tiltV * h;
        }
        heave = clamp(heave, -f.H * 0.25, f.H * 0.25);
        tilt = clamp(tilt, -0.08, 0.08);

        // Fast heaves slap waves off both walls.
        splashClock += f.dt;
        const energy = Math.abs(heaveV) / f.H;
        if (ctx.ripple?.enabled && splashClock > 0.07 && energy > 0.02) {
          splashClock = 0;
          const strength = clamp(energy * 1.5, 0, 1) * p.wallSplash;
          ctx.ripple.addDrop(0.03, 0.06 + Math.random() * 0.5, 0.03, strength);
          ctx.ripple.addDrop(0.97, 0.06 + Math.random() * 0.5, 0.03, strength);
        }
      }

      const rippleTex = ctx.ripple?.enabled ? ctx.ripple.texture : null;
      plane.set({
        horizonY: levelY + heave - p.surfaceDepth * f.H,
        nearY: levelY + heave,
        alpha: p.surfaceDepth > 0.005 ? 1 : 0,
        amp: P.heroSwell,
        depth: PLANE_DEPTH,
        farWidth: FAR_WIDTH,
        nearWidth: NEAR_WIDTH,
        swellSpeed: P.swellSpeed,
        chop: P.chop,
        size: 3.0,
        colorBias: 0.05,
        ripple: rippleTex,
        rippleAmp: P.rippleAmp,
        tilt,
      });
      plane.setDrawFraction(drawFrac);

      const u = material.uniforms;
      u.uLevelY.value = levelY;
      u.uHeave.value = heave;
      u.uTilt.value = tilt;
      u.uAmp.value = P.heroSwell;
      u.uSwellSpeed.value = P.swellSpeed;
      u.uChop.value = P.chop;
      u.uRipple.value = rippleTex;
      u.uRippleOn.value = rippleTex ? 1 : 0;
      u.uRippleAmp.value = P.rippleAmp;
      u.uMeniscus.value = p.meniscus;
      u.uBubbles.value = p.bubbles;

      focus.x = f.W / 2;
      focus.yTop = levelY + heave;
      focus.yBottom = f.H;
      focus.width = f.W;
      focus.intensity = 1;
    },

    glows(out: GlowSpec[]) {
      const surfaceY = levelY + heave;
      // Hot light gathering at the surface, the body's deep glow, and a flare when it moves.
      surfaceColor.copy(rampD[1]).lerp(rampD[2], 0.35);
      // Deep body light is ember red (a dim orange there reads as brown), magenta only as a hint.
      deepColor
        .copy(rampD[0])
        .lerp(rampD[1], 0.3)
        .lerp(ctx.common.uAccentD.value as THREE.Color, 0.12)
        .multiplyScalar(0.8);
      flareColor.copy(rampD[2]);
      const motion = clamp(
        (Math.abs(heaveV) / H) * 3 + Math.abs(tiltV) * 8,
        0,
        1,
      );
      out.push(
        {
          x: W / 2,
          y: surfaceY,
          rx: W * 0.62,
          ry: H * 0.12,
          color: surfaceColor,
          intensity: 0.95 * bodyGlow,
        },
        {
          x: W / 2,
          y: surfaceY + (H - surfaceY) * 0.6,
          rx: W * 0.7,
          ry: Math.max(H * 0.15, (H - surfaceY) * 0.6),
          color: deepColor,
          intensity: 0.32 * bodyGlow,
        },
        {
          x: W / 2,
          y: surfaceY - H * 0.02,
          rx: W * 0.3,
          ry: H * 0.06,
          color: flareColor,
          intensity: 0.8 * motion,
        },
      );
    },

    focus: () => focus,

    drainImpacts() {
      // The cup writes its wall splashes straight into the ripple tank.
    },

    setDrawFraction(frac: number) {
      drawFrac = frac;
      geometry.setDrawRange(0, Math.max(1, Math.floor(capacity * frac)));
      plane.setDrawFraction(frac);
    },

    drawn: () => plane.drawn() + Math.min(capacity, geometry.drawRange.count),

    dispose() {
      geometry.dispose();
      material.dispose();
      plane.dispose();
    },
  };
}
