// PROTOTYPE, never merge. Liquid workshop variant "form": the cascade as one complete,
// choreographed piece that the scroll scrubs.
//
// History: the user picked cascade as closest, then asked for "a proper complete
// animation ... more activity ... cascades should form up images or silhouettes" (round 3,
// time-played shapes + a TEAM RANDOM wordmark intro). Round 4: "scrub yeah", "make sure
// the flow is good", the wordmark is gone ("hideous"), more vibrant colours (LOOKS.vivid).
//
// The story. Scroll position, smoothed by a critically damped spring so wheel steps glide:
//   hero   -> only the pool and its light; scrolling out spills it into the cascade
//   then   -> the shapes take turns, evenly paced down the rest of the page. Each one gets a
//             slot: pour in (falls from above, the bottom of the shape first, like a mould
//             filling) -> hold -> melt (drains down into the pool) while the next one is
//             already pouring. Scroll back up and everything runs backwards.
//   always -> held shapes stay alive in time (wobble, gliding highlights, drops dripping
//             off, a trickle feeding them), lag the scroll on a spring, burst into
//             droplets on a hard fling and gather again, and part around the pointer.
//
// Two shape layers alternate (shape k draws on layer k % 2), so a melt and the next pour
// overlap. All motion is analytic in the vertex shader; the CPU only sets progress.
import * as THREE from "three";

import { NOISE, PARTICLE_COMMON, SPRITE_FRAG } from "../glsl";
import type { CascadeParams } from "../params";
import { particleBlending } from "../pool";
import { clamp, damp, smoothstep, springConstants } from "../scroll";
import { SHAPES, loadFonts, sampleShape, type ShapeTargets } from "../shapes";

import { createCascade } from "./cascade";
import type {
  FrameState,
  GlowSpec,
  Impact,
  VariantContext,
  VariantSystem,
} from "./types";

const SHAPE_VERT = /* glsl */ `
${PARTICLE_COMMON}
${NOISE}
attribute vec4 aTarget;   // x, y (shape units: height 1, y up), h (0 bottom..1 top), edge
attribute vec4 aShade;    // x: thickness (0 edge..1 core), yz: inward direction (y up)
attribute vec4 aSeed;     // four independent randoms
uniform vec2 uCenter;     // px
uniform float uScale;     // px per shape unit
uniform vec2 uStretch;    // squash + stretch from the follow spring
uniform float uOffset;    // follow-spring offset (px, +down)
uniform float uForm;      // 0..1 poured in (scrubbed)
uniform float uRelease;   // 0..1 melted out (scrubbed)
uniform float uSplash;    // 0..1 burst apart by a hard fling
uniform vec3 uPointer;    // xy: pointer (px), z: how much it is touching the liquid
uniform float uLandY;     // melted liquid vanishes into the pool here
uniform float uWobble;
uniform float uGlint;
uniform float uDrips;
uniform float uClock;
uniform float uSize;
uniform float uAlphaK;
uniform vec3 uLight;      // light direction (shape space, z towards the viewer)

void main() {
  float r1 = aSeed.x;
  float r2 = aSeed.y;
  float r3 = aSeed.z;
  float r4 = aSeed.w;
  float h = aTarget.z;
  float edge = aTarget.w;
  float tau = aShade.x;

  // The slot. The bottom follows the page drag more than the top: a jelly-like shear.
  vec2 local = aTarget.xy * uStretch;
  vec2 pos = uCenter + vec2(local.x, -local.y) * uScale;
  pos.y += uOffset * (1.15 - 0.3 * h);

  // Holding: surface-tension wobble.
  float wt = uTime * 0.45;
  pos += vec2(
    snoise(vec3(aTarget.xy * 2.2, wt + r1 * 3.0)),
    snoise(vec3(aTarget.xy * 2.2 + 11.0, wt))
  ) * uWobble;

  // The silhouette as a liquid surface: rounded over its thickness, rippling, lit by a
  // light that slowly orbits, so highlights glide across it and the rims catch light.
  vec2 ripple = vec2(
    snoise(vec3(aTarget.xy * 5.0, uTime * 0.6 + 3.0)),
    snoise(vec3(aTarget.xy * 5.0 + 5.0, uTime * 0.6))
  ) * 0.25 * uGlint;
  vec3 nrm = normalize(vec3(-aShade.yz * (1.0 - tau) * 1.6 + ripple, 0.25 + tau));
  float diff = max(dot(nrm, uLight), 0.0);
  float spec = pow(max(dot(nrm, normalize(uLight + vec3(0.0, 0.0, 1.0))), 0.0), 28.0) * uGlint;
  float rim = pow(1.0 - nrm.z, 3.0);
  // Additive looks: hotter = brighter (shadow -> cream highlights). Light: shadow = ink.
  float shaded = mix(
    0.28 + 0.4 * diff + 0.5 * spec + 0.25 * rim + 0.06 * h,
    0.3 + 0.45 * (1.0 - diff) + 0.15 * rim - 0.35 * spec,
    uTheme
  );
  float aLit = mix(
    0.75 + 0.45 * diff + 1.4 * spec + 0.4 * rim,
    0.9 + 0.3 * (1.0 - diff) - 0.45 * spec,
    uTheme
  );

  // Pouring in: falls from above the screen through the empty mould, so the bottom of
  // the shape fills first and the level rises (h is 0 at the bottom).
  float arrive = 0.08 + 0.64 * h + 0.18 * r1;
  float fallDur = 0.2 + 0.1 * r2;
  float q = clamp((uForm - arrive + fallDur) / fallDur, 0.0, 1.0);
  float startY = -24.0 - 160.0 * r3;
  float alpha = smoothstep(0.0, 0.12, q) * mix(1.0, aLit, q);
  float tcol = mix(0.95, shaded, q);
  if (q < 1.0) {
    pos.y = mix(startY, pos.y, q * q);
    pos.x += (1.0 - q) * sin(r4 * 6.2831 + uTime * 2.0) * 5.0;
  }

  bool held = q >= 1.0 && uRelease <= 0.0;
  if (held && edge > 1.5 && r2 < 0.35 * uDrips) {
    // Drips: a drop swells on a bottom edge, lets go, falls into the pool, then the
    // mould refills it.
    float period = 3.5 + 5.0 * r3;
    float c = fract(uClock / period + r1);
    if (c < 0.5) {
      float k = c / 0.5;
      float tf = max(k - 0.35, 0.0) / 0.65 * period * 0.5;
      pos.y += smoothstep(0.0, 0.35, k) * 6.0 + 900.0 * tf * tf;
      alpha *= 1.0 - smoothstep(uLandY - 40.0, uLandY, pos.y);
      tcol = mix(0.85, tcol, uTheme);
    } else {
      alpha *= smoothstep(0.62, 0.8, c);
    }
  } else if (held && edge < 0.5 && r2 > 1.0 - 0.06 * uDrips) {
    // A trickle keeps feeding the shape from above.
    float period = 5.0 + 4.0 * r3;
    float c = fract(uClock / period + r4);
    if (c < 0.12) {
      float k = c / 0.12;
      pos.y = mix(startY, pos.y, k * k);
      alpha *= smoothstep(0.0, 0.2, k);
      tcol = mix(0.95, tcol, uTheme);
    }
  }

  if (uRelease > 0.0) {
    // Melting: the bottom lets go first and everything drains down into the pool. The
    // scroll owns the progress, so this runs backwards when you scroll back up.
    float m = clamp((uRelease - (0.45 * h + 0.15 * r1)) / 0.4, 0.0, 1.0);
    pos.y += (max(uLandY - pos.y, 0.0) + 60.0) * m * m;
    pos.x += (r4 - 0.5) * 60.0 * m + sin(uTime * 3.0 + r1 * 20.0) * 3.0 * m;
    tcol -= 0.25 * m * (1.0 - uTheme);
    alpha *= 1.0 - smoothstep(uLandY - 40.0, uLandY + 6.0, pos.y);
  }

  // A hard fling bursts the liquid into droplets; it gathers again as the scroll slows.
  vec2 burst = normalize(vec2(r2 - 0.5, r3 - 0.5) + 1e-4);
  pos += burst * uSplash * (24.0 + 110.0 * r4) * (0.35 + 0.65 * (1.0 - tau));
  alpha *= 1.0 - 0.35 * uSplash;

  // The pointer parts the liquid and warms it where it touches.
  vec2 dp = pos - uPointer.xy;
  float touch = exp(-dot(dp, dp) / (120.0 * 120.0)) * uPointer.z;
  pos += normalize(dp + 1e-4) * touch * 48.0;
  tcol += touch * 0.3 * (1.0 - uTheme);

  float hueN = snoise(vec3(pos * 0.002, uTime * 0.05)) * 0.5 + 0.5;
  vColor = liquidColor(clamp(tcol, 0.0, 1.0), hueN, r1);
  vAlpha = alpha * uAlphaK * mix(0.6, 1.0, r3);
  gl_PointSize =
    uSize * uSizeScale * uPixelRatio * mix(0.8, 1.2, r2) * mix(0.9, 1.3, tau);
  gl_Position = toClip(pos);
}
`;

interface Layer {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  target: THREE.BufferAttribute;
  shade: THREE.BufferAttribute;
  /** Index into SHAPES currently uploaded, -1 when none. */
  shape: number;
  off: number;
  offV: number;
}

/** Where the first shape's scroll slot starts, and how long a slot is (px of scroll). */
function storyLayout(f: FrameState, n: number) {
  const s = f.sections;
  // The first shape starts pouring once the hero pool has mostly spilled away.
  const start = Math.max(f.H * 0.25, s.heroBottom - f.H * 0.45);
  const end = Math.max(start + n * f.H * 0.3, s.docH - f.H);
  return { start, slot: (end - start) / n };
}

export function createForm(ctx: VariantContext): VariantSystem {
  // The cascade the user liked, unchanged, a little thinner so the shapes lead.
  const sheet = createCascade({
    ...ctx,
    budget: { ...ctx.budget, cascade: Math.round(ctx.budget.cascade * 0.8) },
  });
  const sheetParams: CascadeParams = {
    veil: 0.55,
    veilWidth: 0.42,
    mist: 0.7,
    sway: 0.6,
    thinning: 0.35,
  };

  const capacity = ctx.budget.shape;
  const group = new THREE.Group();
  group.add(sheet.object);

  const makeLayer = (): Layer => {
    const target = new THREE.BufferAttribute(new Float32Array(capacity * 4), 4);
    target.setUsage(THREE.DynamicDrawUsage);
    const shade = new THREE.BufferAttribute(new Float32Array(capacity * 4), 4);
    shade.setUsage(THREE.DynamicDrawUsage);
    const seeds = new Float32Array(capacity * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    const geometry = new THREE.BufferGeometry();
    // Positions are computed in the shader; three still wants a position attribute.
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(capacity * 3), 3),
    );
    geometry.setAttribute("aTarget", target);
    geometry.setAttribute("aShade", shade);
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    const material = new THREE.ShaderMaterial({
      uniforms: {
        ...ctx.common,
        uCenter: { value: new THREE.Vector2() },
        uScale: { value: 100 },
        uStretch: { value: new THREE.Vector2(1, 1) },
        uOffset: { value: 0 },
        uForm: { value: 0 },
        uRelease: { value: 0 },
        uSplash: { value: 0 },
        uLandY: { value: 0 },
        uWobble: { value: 2.5 },
        uGlint: { value: 1 },
        uDrips: { value: 1 },
        uClock: { value: 0 },
        uSize: { value: 2.4 },
        uAlphaK: { value: 0.5 },
        uLight: { value: new THREE.Vector3(0, 0.6, 0.8) },
      },
      vertexShader: SHAPE_VERT,
      fragmentShader: SPRITE_FRAG,
      ...particleBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.visible = false;
    points.renderOrder = 2;
    group.add(points);
    return {
      points,
      geometry,
      material,
      target,
      shade,
      shape: -1,
      off: 0,
      offV: 0,
    };
  };
  const layers: [Layer, Layer] = [makeLayer(), makeLayer()];

  // Shapes are sampled once the site's fonts are in (text shapes draw with them).
  let targets: ShapeTargets[] | null = null;
  let disposed = false;
  void loadFonts(ctx.fonts).then(() => {
    if (disposed) return;
    targets = SHAPES.map((spec) => sampleShape(spec, capacity, ctx.fonts));
  });

  const n = SHAPES.length;
  const form = new Float32Array(n);
  const release = new Float32Array(n);
  const lastRelease = new Float32Array(n);
  let clock = 0;
  let storyY: number | null = null;
  let storyV = 0;
  let splash = 0;
  let pending: Impact[] = [];
  let meltAcc = 0;
  let shapeVeil = 0;
  let shapeVeilW = 0;
  let label = "";
  const glowColor = new THREE.Color();
  const rampD = ctx.common.uRampD.value as THREE.Color[];
  const glowSpecs: GlowSpec[] = [];

  const upload = (layer: Layer, shape: number) => {
    const t = targets![shape];
    (layer.target.array as Float32Array).set(t.points);
    layer.target.needsUpdate = true;
    (layer.shade.array as Float32Array).set(t.shade);
    layer.shade.needsUpdate = true;
    layer.shape = shape;
  };

  return {
    key: "form",
    object: group,

    update(f) {
      const p = f.params.form;
      const L = f.params.common.liquid;
      clock += f.dt;

      // A formed shape pushes the cascade behind it back a little (last frame's value).
      sheetParams.veil = Math.max(p.veil, shapeVeil);
      sheetParams.veilWidth = Math.max(p.veilWidth, shapeVeilW);
      sheetParams.mist = p.mist;
      sheetParams.sway = p.sway;
      sheetParams.thinning = p.thinning;
      sheet.update({ ...f, params: { ...f.params, cascade: sheetParams } });
      shapeVeil = 0;
      shapeVeilW = 0;
      glowSpecs.length = 0;
      label = "";

      if (!targets) return;

      // The story position: the scroll, smoothed so wheel steps and flicks glide.
      const snap = f.reduced || f.settle || storyY === null || p.scrub < 0.02;
      let y = storyY ?? f.scrollY;
      if (snap) {
        y = f.scrollY;
        storyV = 0;
      } else {
        const spring = springConstants(p.scrub, 1);
        const sub = Math.max(1, Math.ceil(f.dt / (1 / 120)));
        const h = f.dt / sub;
        for (let i = 0; i < sub; i++) {
          storyV += (spring.k * (f.scrollY - y) - spring.c * storyV) * h;
          y += storyV * h;
        }
      }
      storyY = y;

      // Progress per shape: pour in over the first part of its slot, melt out across the
      // end of it (overlapping the next shape's pour); the last one never melts.
      const { start, slot } = storyLayout(f, n);
      const pinned = SHAPES.findIndex((s) => s.key === p.shape);
      for (let k = 0; k < n; k++) {
        const s0 = start + k * slot;
        release[k] = 0;
        if (pinned >= 0) {
          form[k] = k === pinned ? 1 : 0;
        } else if (f.reduced) {
          // No pours or melts under reduced motion: the slot's shape, simply there.
          const inSlot = y >= s0 && (y < s0 + slot || k === n - 1);
          form[k] = inSlot || (k === 0 && y < s0) ? 1 : 0;
        } else {
          form[k] = clamp((y - s0) / (p.pourLen * slot), 0, 1);
          if (k < n - 1) {
            const m0 = s0 + slot - 0.45 * p.meltLen * slot;
            release[k] = clamp((y - m0) / (p.meltLen * slot), 0, 1);
          }
        }
      }

      // A hard fling bursts the shapes; they gather again as the scroll slows.
      const fling = f.reduced
        ? 0
        : clamp((Math.abs(f.velN) - 0.5) / 2, 0, 1) * p.splash;
      splash = snap
        ? fling
        : damp(splash, fling, fling > splash ? 14 : 2.2, f.dt);

      // Melted liquid (and drips) vanish into the hero pool while it is on screen below
      // the shape, otherwise into the bottom pool.
      const s = f.sections;
      const heroH = Math.max(1, s.heroBottom - s.heroTop);
      const P = f.params.common.pools;
      const heroHorizon = s.heroTop + heroH * P.heroHorizon - f.scrollY;
      const heroNear = s.heroBottom + heroH * 0.06 - f.scrollY;
      const heroLand =
        heroNear > 0
          ? heroHorizon + (heroNear - heroHorizon) * 0.3
          : Number.POSITIVE_INFINITY;

      const follow = springConstants(L.response, L.damping);
      const sub = Math.max(1, Math.ceil(f.dt / (1 / 120)));
      const hStep = f.dt / sub;
      const a = clock * 0.35;
      const shown = [false, false];

      for (let k = 0; k < n; k++) {
        const dR = release[k] - lastRelease[k];
        lastRelease[k] = release[k];
        if (form[k] <= 0 || release[k] >= 1) continue;
        const l = layers[k % 2];
        if (l.shape !== k) upload(l, k);
        shown[k % 2] = true;
        l.points.visible = true;

        const aspect = targets[k].aspect;
        const scale =
          Math.min(f.H * 0.4, (f.W * 0.84) / Math.max(0.2, aspect)) *
          p.shapeSize;
        const cx = f.W / 2;
        const cy = f.H * p.shapeY;

        // Follow: the page drags the liquid along, a spring brings it back (with a wobble).
        if (snap) {
          l.off = l.offV = 0;
        } else {
          l.off -= f.dy * L.attach * 0.45 * p.follow;
          for (let i = 0; i < sub; i++) {
            l.offV += (-follow.k * l.off - follow.c * l.offV) * hStep;
            l.off += l.offV * hStep;
          }
          l.off = clamp(l.off, -f.H * 0.18, f.H * 0.18);
        }
        const stretch = 1 + clamp((Math.abs(l.offV) / f.H) * 0.25, 0, 0.25);

        const u = l.material.uniforms;
        (u.uCenter.value as THREE.Vector2).set(cx, cy);
        u.uScale.value = scale;
        (u.uStretch.value as THREE.Vector2).set(
          1 / Math.sqrt(stretch),
          stretch,
        );
        u.uOffset.value = l.off;
        u.uForm.value = form[k];
        u.uRelease.value = release[k];
        u.uSplash.value = splash;
        u.uLandY.value =
          heroLand > cy + scale * 0.6 ? Math.min(heroLand, f.landY) : f.landY;
        u.uWobble.value = f.reduced ? 0 : p.wobble;
        u.uGlint.value = p.glint;
        u.uDrips.value = f.reduced ? 0 : p.drips;
        u.uClock.value = clock;
        // The light orbits slowly, so highlights glide over the liquid.
        (u.uLight.value as THREE.Vector3)
          .set(Math.cos(a) * 0.55, 0.5 + 0.2 * Math.sin(a * 0.7), 0.75)
          .normalize();

        // Light behind the shape, so the silhouette glows like the pools do.
        const formed =
          smoothstep(0.2, 1, form[k]) * (1 - smoothstep(0, 0.7, release[k]));
        const shapeW = scale * aspect;
        glowColor.copy(rampD[1]).lerp(rampD[2], 0.3);
        glowSpecs.push({
          x: cx,
          y: cy + l.off,
          rx: shapeW * 0.5 + 60,
          ry: scale * 0.75 + 40,
          color: glowColor,
          intensity: 0.6 * p.shapeGlow * formed,
        });
        if (p.sheetVeil * formed > shapeVeil) {
          shapeVeil = p.sheetVeil * formed;
          shapeVeilW = Math.min(1, (shapeW / f.W) * 1.15);
        }
        // Melting forward splashes the pool across the shape's width.
        if (dR > 0) {
          meltAcc += dR;
          while (meltAcc > 0.02) {
            meltAcc -= 0.02;
            pending.push({
              x: cx + (Math.random() - 0.5) * shapeW,
              strength: 0.22,
              radius: 0.02,
            });
          }
        }
        const phase =
          release[k] > 0 ? "melting" : form[k] < 1 ? "pouring" : "holding";
        const pct = Math.round((release[k] > 0 ? release[k] : form[k]) * 100);
        label += `${label ? " + " : ""}${SHAPES[k].key} ${phase} ${pct}%`;
      }
      for (let i = 0; i < 2; i++) {
        if (!shown[i]) layers[i].points.visible = false;
      }
    },

    extraGlows(out) {
      for (const g of glowSpecs) out.push(g);
    },

    debug: () => ({ story: label || "pool (no shape)" }),

    focus: () => sheet.focus(),

    drainImpacts(out) {
      sheet.drainImpacts(out);
      for (const im of pending) out.push(im);
      pending = [];
    },

    setDrawFraction(frac) {
      sheet.setDrawFraction(frac);
      for (const l of layers) {
        l.geometry.setDrawRange(0, Math.max(1, Math.floor(capacity * frac)));
      }
    },

    drawn: () =>
      sheet.drawn() +
      layers.reduce(
        (sum, l) =>
          sum +
          (l.points.visible
            ? Math.min(capacity, l.geometry.drawRange.count)
            : 0),
        0,
      ),

    dispose() {
      disposed = true;
      sheet.dispose();
      for (const l of layers) {
        l.geometry.dispose();
        l.material.dispose();
      }
    },
  };
}
