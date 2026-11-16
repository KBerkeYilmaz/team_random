// PROTOTYPE, never merge. Liquid workshop variant "form" (round 3): the cascade, as a
// complete choreographed piece. The user picked cascade as closest, then asked for "a
// proper complete animation ... more activity ... cascades should form up images or
// silhouettes".
//
// The story, keyed to the real section anchors (so it survives the section redesign):
//   load      -> liquid pours in from above and fills the TEAM RANDOM wordmark, bottom
//                first, like a mould filling up (the intro)
//   hero      -> the wordmark holds as living liquid: surface wobble, glints sweeping
//                through it, drops dripping off its bottom edges, a trickle feeding it
//   scroll    -> each section's silhouette melts (drains down into the pool with gravity)
//                while the next one pours in from the top: code -> design -> web -> CRM
//                -> contact (the site's own service icons)
//   always    -> the cascade (unchanged from the variant the user liked) keeps falling
//                behind, the pools fill, and every shape lags the scroll on a spring, so
//                the liquid follows you and settles with a wobble when you stop
//
// Two shape layers ping-pong: one melts while the other pours in. All motion is analytic
// in the vertex shader (time since pour / since melt), so a shape costs nothing on the CPU.
import * as THREE from "three";

import { NOISE, PARTICLE_COMMON, SPRITE_FRAG } from "../glsl";
import type { CascadeParams } from "../params";
import { particleBlending } from "../pool";
import { clamp, smoothstep, springConstants } from "../scroll";
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
uniform float uFormT;     // s since this shape started pouring in (frozen once it melts)
uniform float uFormDur;
uniform float uReleaseT;  // s since it started melting (< 0 while it holds)
uniform float uReleaseDur;
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
  // Dark: hotter = brighter (red in shadow -> gold highlights). Light: shadow = deeper ink.
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

  // Pouring in: falls from above the screen, the bottom of the shape fills first.
  float f = uFormT / uFormDur;
  float arrive = 0.08 + 0.64 * (1.0 - h) + 0.18 * r1;
  float fallDur = 0.2 + 0.1 * r2;
  float q = clamp((f - arrive + fallDur) / fallDur, 0.0, 1.0);
  float startY = -24.0 - 160.0 * r3;
  float alpha = smoothstep(0.0, 0.12, q) * mix(1.0, aLit, q);
  float tcol = mix(0.95, shaded, q);
  if (q < 1.0) {
    pos.y = mix(startY, pos.y, q * q);
    pos.x += (1.0 - q) * sin(r4 * 6.2831 + uTime * 2.0) * 5.0;
  } else {
    // Landing in the mould: a small splash that settles.
    float post = clamp((f - arrive) / 0.1, 0.0, 1.0);
    pos.y += sin(post * 3.14159) * 4.0 * (1.0 - post);
  }

  bool held = q >= 1.0 && uReleaseT < 0.0;
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

  if (uReleaseT >= 0.0) {
    // Melting: the bottom lets go first, everything drains down into the pool.
    float delay = (0.5 * h + 0.22 * r1) * uReleaseDur;
    float t = max(uReleaseT - delay, 0.0);
    pos.y += 900.0 * t * t + 30.0 * t;
    pos.x += (r4 - 0.5) * 50.0 * t + sin(uTime * 3.0 + r1 * 20.0) * 4.0 * t;
    tcol -= 0.25 * clamp(t * 1.5, 0.0, 1.0) * (1.0 - uTheme);
    alpha *= 1.0 - smoothstep(uLandY - 40.0, uLandY + 6.0, pos.y);
    alpha *= 1.0 - smoothstep(0.6, 1.6, t);
  }

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
  /** Index into SHAPES, -1 when idle. */
  shape: number;
  formStart: number;
  releaseStart: number | null;
  off: number;
  offV: number;
  cx: number;
  cy: number;
  scale: number;
  aspect: number;
}

/** Which silhouette the page is on (the section beats). */
function beatShape(f: FrameState): number {
  const s = f.sections;
  const heroH = Math.max(1, s.heroBottom - s.heroTop);
  if (f.scrollY < s.heroTop + heroH * 0.2) return 0;
  const a = s.servicesTop - f.H * 0.35;
  if (f.scrollY < a) return 1;
  const b = s.ctaTop - f.H * 0.35;
  if (f.scrollY < b) {
    const k = (f.scrollY - a) / Math.max(1, b - a);
    return k < 1 / 3 ? 2 : k < 2 / 3 ? 3 : 4;
  }
  return 5;
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
        uFormT: { value: 0 },
        uFormDur: { value: 2.4 },
        uReleaseT: { value: -1 },
        uReleaseDur: { value: 1.6 },
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
      formStart: 0,
      releaseStart: null,
      off: 0,
      offV: 0,
      cx: 0,
      cy: 0,
      scale: 1,
      aspect: 1,
    };
  };
  const layers: [Layer, Layer] = [makeLayer(), makeLayer()];

  // Shapes are sampled once the site's fonts are in (the wordmark uses Pixelify Sans).
  let targets: ShapeTargets[] | null = null;
  let disposed = false;
  void loadFonts(ctx.fonts).then(() => {
    if (disposed) return;
    targets = SHAPES.map((spec) => sampleShape(spec, capacity, ctx.fonts));
  });

  let clock = 0;
  let started = false;
  let lastReplay = 0;
  let pending: Impact[] = [];
  let meltClock = 0;
  let shapeVeil = 0;
  let shapeVeilW = 0;
  const glowColor = new THREE.Color();
  const rampD = ctx.common.uRampD.value as THREE.Color[];
  const glowSpecs: GlowSpec[] = [];

  const assign = (layer: Layer, shape: number, start: number) => {
    const t = targets![shape];
    (layer.target.array as Float32Array).set(t.points);
    layer.target.needsUpdate = true;
    (layer.shade.array as Float32Array).set(t.shade);
    layer.shade.needsUpdate = true;
    layer.shape = shape;
    layer.aspect = t.aspect;
    layer.formStart = start;
    layer.releaseStart = null;
  };

  const current = () =>
    layers.find((l) => l.shape >= 0 && l.releaseStart === null) ?? null;

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

      if (!targets) return;
      const pick = SHAPES.findIndex((s) => s.key === p.shape);
      const want = pick >= 0 ? pick : beatShape(f);
      const snap = f.reduced || f.settle;
      let cur = current();

      if (snap) {
        // Static frame / clean screenshot: the section's shape, fully formed, nothing melting.
        if (!cur || cur.shape !== want) {
          cur = cur ?? layers[0];
          assign(cur, want, clock);
        }
        cur.formStart = clock - p.formTime * 2;
        for (const l of layers) {
          if (l !== cur) l.shape = -1;
          l.off = l.offV = 0;
        }
      } else if (!cur || cur.shape !== want) {
        if (cur) cur.releaseStart = clock;
        const other = layers.find((l) => l !== cur)!;
        // The intro waits a beat for the page to settle; later shapes start pouring just
        // after the previous one starts to melt, so you see the hand-over.
        assign(other, want, clock + (started ? 0.35 : 0.6));
        other.off = cur?.off ?? 0;
        other.offV = cur?.offV ?? 0;
        if (cur) meltClock = 0;
      } else if (p.replay !== lastReplay) {
        cur.formStart = clock;
        for (const l of layers) if (l !== cur) l.shape = -1;
      }
      lastReplay = p.replay;
      started = true;

      // Placement: centred, as large as the viewport allows.
      const { k, c } = springConstants(L.response, L.damping);
      const steps = Math.max(1, Math.ceil(f.dt / (1 / 120)));
      const h = f.dt / steps;
      glowSpecs.length = 0;
      for (const l of layers) {
        if (l.shape < 0) {
          l.points.visible = false;
          continue;
        }
        const melted = l.releaseStart !== null ? clock - l.releaseStart : -1;
        if (melted > p.meltTime + 1.4) {
          l.shape = -1;
          l.points.visible = false;
          continue;
        }
        l.points.visible = true;
        l.scale =
          Math.min(f.H * 0.4, (f.W * 0.84) / Math.max(0.2, l.aspect)) *
          p.shapeSize;
        l.cx = f.W / 2;
        l.cy = f.H * p.shapeY;

        // Follow: the page drags the liquid along, a spring brings it back (with a wobble).
        if (!snap) {
          l.off -= f.dy * L.attach * 0.45 * p.follow;
          for (let i = 0; i < steps; i++) {
            l.offV += (-k * l.off - c * l.offV) * h;
            l.off += l.offV * h;
          }
          l.off = clamp(l.off, -f.H * 0.18, f.H * 0.18);
        }
        const stretch = 1 + clamp((Math.abs(l.offV) / f.H) * 0.25, 0, 0.25);

        const formT =
          (l.releaseStart !== null ? l.releaseStart : clock) - l.formStart;
        const u = l.material.uniforms;
        (u.uCenter.value as THREE.Vector2).set(l.cx, l.cy);
        u.uScale.value = l.scale;
        (u.uStretch.value as THREE.Vector2).set(
          1 / Math.sqrt(stretch),
          stretch,
        );
        u.uOffset.value = l.off;
        u.uFormT.value = formT;
        u.uFormDur.value = p.formTime;
        u.uReleaseT.value = melted;
        u.uReleaseDur.value = p.meltTime;
        u.uLandY.value =
          heroLand > l.cy + l.scale * 0.6
            ? Math.min(heroLand, f.landY)
            : f.landY;
        u.uWobble.value = f.reduced ? 0 : p.wobble;
        u.uGlint.value = p.glint;
        u.uDrips.value = f.reduced ? 0 : p.drips;
        u.uClock.value = clock;
        // The light orbits slowly, so highlights glide over the liquid.
        const a = clock * 0.35;
        (u.uLight.value as THREE.Vector3)
          .set(Math.cos(a) * 0.55, 0.5 + 0.2 * Math.sin(a * 0.7), 0.75)
          .normalize();

        // Light behind the shape, so the silhouette glows like the pools do.
        const formed = smoothstep(0.35, 1, formT / p.formTime);
        const gone = melted < 0 ? 0 : smoothstep(0, 0.8, melted / p.meltTime);
        const shapeW = l.scale * l.aspect;
        glowColor.copy(rampD[1]).lerp(rampD[2], 0.3);
        glowSpecs.push({
          x: l.cx,
          y: l.cy + l.off,
          rx: shapeW * 0.5 + 60,
          ry: l.scale * 0.75 + 40,
          color: glowColor,
          intensity: 0.6 * p.shapeGlow * formed * (1 - gone),
        });
        if (melted < 0) {
          shapeVeil = p.sheetVeil * formed;
          shapeVeilW = Math.min(1, (shapeW / f.W) * 1.15);
        } else if (melted < p.meltTime) {
          // Melting liquid splashes into the pool across the shape's width.
          meltClock += f.dt;
          if (meltClock > 0.05) {
            meltClock = 0;
            pending.push({
              x: l.cx + (Math.random() - 0.5) * shapeW,
              strength: 0.22 * (1 - gone),
              radius: 0.02,
            });
          }
        }
      }
    },

    extraGlows(out) {
      for (const g of glowSpecs) out.push(g);
    },

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
        (n, l) =>
          n +
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
