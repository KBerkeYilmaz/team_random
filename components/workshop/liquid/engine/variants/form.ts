// PROTOTYPE, never merge. Liquid workshop variant "form": the cascade as one complete,
// choreographed piece that the scroll scrubs.
//
// History: the user picked cascade as closest, then asked for "a proper complete
// animation ... more activity ... cascades should form up images or silhouettes" (round 3,
// time-played shapes + a TEAM RANDOM wordmark intro). Round 4: "scrub yeah", "make sure
// the flow is good", the wordmark is gone ("hideous"), more vibrant colours (LOOKS.vivid).
// Round 5 (after "going really good"): the liquid morph hand-over and pool reflections.
// Round 6: "pool particles should slowly transition into falling particles ... right now
// they are disconnected": one continuous liquid. The hero pool drains (scrubbed): it
// slides over its near edge and pours, and the falls cross-fade out of that pour. Once it
// is empty the falls come from above. Shapes sit lower.
// Round 7: "it should fall a little bit before turning into the code shape ... not from
// the actual pool ... pool, a couple of seconds going on, to turn into code": the pool
// pours out completely into the falls first; then, after a stretch of just falls, falling
// droplets bend out of the falls into the first shape. (Out of the pool, round 6, and
// from above, round 4, stay as panel options.)
//
// The story. Scroll position, smoothed by a critically damped spring so wheel steps glide:
//   hero   -> only the pool and its light; scrolling out, it slowly slides over its near
//             edge and pours, and that pour becomes the cascade
//   then   -> the shapes take turns down the rest of the page. The first one gets a longer
//             turn: droplets of the falls fall a little, then turn into it (the bottom of
//             the shape first, like a mould filling).
//             Each hand-over is either:
//               morph (default): the same liquid slumps into a glowing puddle under the
//                 shape, then rises out of it into the next shape, bottom first;
//               melt: it drains down into the pool while the next one pours in from above.
//             Scroll back up and everything runs backwards.
//   always -> held shapes stay alive in time (wobble, gliding highlights, drops dripping
//             off, a trickle feeding them), lag the scroll on a spring, burst into
//             droplets on a hard fling and gather again, part around the pointer, and
//             reflect in the bottom pool once it has filled enough to hold them.
//
// Melt draws shape k on layer k % 2 so a melt and the next pour overlap. Morph uses one
// layer carrying two target sets (this shape and the next), paired bottom-to-top so each
// droplet has a partner. All motion is analytic in the vertex shader; the CPU only sets
// progress.
import * as THREE from "three";

import { NOISE, PARTICLE_COMMON, SPRITE_FRAG } from "../glsl";
import type { CascadeParams } from "../params";
import {
  POOL_SURFACE_GLSL,
  particleBlending,
  poolSurfaceUniforms,
} from "../pool";
import { clamp, damp, lerp, smoothstep, springConstants } from "../scroll";
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
${POOL_SURFACE_GLSL}
attribute vec4 aTarget;   // shape A: x, y (shape units: height 1, y up), h (0 bottom..1 top), edge
attribute vec4 aShade;    // shape A: thickness (0 edge..1 core), inward direction (y up)
attribute vec4 aTargetB;  // shape B (the morph's destination), same layout
attribute vec4 aShadeB;
attribute vec4 aSeed;     // four independent randoms
uniform vec2 uCenter;     // px
uniform float uScale;     // px per shape unit (A)
uniform float uScaleB;    // px per shape unit (B)
uniform vec2 uStretch;    // squash + stretch from the follow spring
uniform float uOffset;    // follow-spring offset (px, +down)
uniform float uForm;      // 0..1 poured in (scrubbed)
uniform float uRelease;   // 0..1 melted out (scrubbed)
uniform float uMorphOn;   // 1: hand-overs morph A -> B instead of melting
uniform float uMorph;     // 0..1 slump into the puddle, then rise into B (scrubbed)
uniform float uPuddleY;   // the puddle's surface line (px, before the follow offset)
uniform float uPuddleW;   // its half width (px)
uniform float uPuddleT;   // its thickness (px)
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
uniform float uFirstFrom; // where a pour-in comes from: 0 above, 1 the hero pool, 2 the falls
uniform float uPoolLeft;  // how much of the hero pool's surface is left (v units, 0..1)
uniform float uFallTop;   // where the falls start on screen (px)
uniform float uFallFirst; // share of a droplet's trip spent just falling before it turns
#ifdef MIRROR
uniform float uMirrorY;   // the bottom pool's surface line (px)
uniform float uReflect;   // reflection strength (0 hides it)
#endif

// A target's slot on screen. The bottom follows the page drag more than the top: a
// jelly-like shear.
vec2 slotOf(vec4 T, float scale) {
  vec2 local = T.xy * uStretch;
  vec2 p = uCenter + vec2(local.x, -local.y) * scale;
  p.y += uOffset * (1.15 - 0.3 * T.z);
  return p;
}

void main() {
  float r1 = aSeed.x;
  float r2 = aSeed.y;
  float r3 = aSeed.z;
  float r4 = aSeed.w;

  // Morph timing (both 0 outside a morph). t1: A slumps into the puddle (all together,
  // like a collapse). t2: rises out of it into B, the bottom of B first.
  float t1 = 0.0;
  float t2 = 0.0;
  if (uMorphOn > 0.5) {
    t1 = clamp((uMorph - 0.08 * r1) / 0.42, 0.0, 1.0);
    t2 = clamp((uMorph - 0.48 - 0.28 * aTargetB.z - 0.04 * r1) / 0.2, 0.0, 1.0);
  }
  bool onB = t2 > 0.0;
  vec4 T = onB ? aTargetB : aTarget;
  vec4 S = onB ? aShadeB : aShade;
  float h = T.z;
  float edge = T.w;
  float tau = S.x;

  vec2 pos = slotOf(T, onB ? uScaleB : uScale);

  // Holding: surface-tension wobble.
  float wt = uTime * 0.45;
  vec2 wobble = vec2(
    snoise(vec3(T.xy * 2.2, wt + r1 * 3.0)),
    snoise(vec3(T.xy * 2.2 + 11.0, wt))
  ) * uWobble;
  pos += wobble;

  // The silhouette as a liquid surface: rounded over its thickness, rippling, lit by a
  // light that slowly orbits, so highlights glide across it and the rims catch light.
  vec2 ripple = vec2(
    snoise(vec3(T.xy * 5.0, uTime * 0.6 + 3.0)),
    snoise(vec3(T.xy * 5.0 + 5.0, uTime * 0.6))
  ) * 0.25 * uGlint;
  vec3 nrm = normalize(vec3(-S.yz * (1.0 - tau) * 1.6 + ripple, 0.25 + tau));
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

  // Pouring in: the bottom of the shape fills first and the level rises (h: 0 bottom).
  // Each droplet sets off at its own moment (never before uForm 0, so nothing pops in
  // mid-air) and travels for fallDur, in uForm units.
  bool fromFalls = uFirstFrom > 1.5;
  bool fromPool = uFirstFrom > 0.5 && !fromFalls;
  float fallDur = fromFalls
    ? 0.55 + 0.15 * r2
    : fromPool ? 0.3 + 0.12 * r2 : 0.2 + 0.1 * r2;
  float depart = (1.0 - fallDur) * clamp(0.78 * h + 0.22 * r1, 0.0, 1.0);
  float q = clamp((uForm - depart) / fallDur, 0.0, 1.0);
  float startY = -24.0 - 160.0 * r3;
  float alpha;
  float tcol;
  if (fromFalls && q < 1.0) {
    // Out of the falls (the pool has poured into them by now): the droplet starts as one
    // of the falling particles, spread wider than the shape, and falls with them for the
    // first uFallFirst of its trip. Then its fall bends into its place in the shape:
    // a Hermite curve that leaves with the fall's downward speed (so it carries on down a
    // little through the turn) and arrives at rest.
    vec2 slot = pos;
    float qf = clamp(uFallFirst, 0.05, 0.9);
    float drift = sin(r1 * 40.0 + uTime * 1.3) * 6.0;
    vec2 fallStart = vec2(
      uCenter.x + (slot.x - uCenter.x) * 1.4 + (r4 - 0.5) * uViewport.x * 0.35,
      max(uFallTop, 0.0) + r3 * uViewport.y * 0.3
    );
    float fallPx = uViewport.y * (0.12 + 0.1 * r2);
    if (q < qf) {
      float k = q / qf;
      pos = fallStart + vec2(drift * k, fallPx * k * k);
    } else {
      float t = (q - qf) / (1.0 - qf);
      vec2 fallEnd = fallStart + vec2(drift, fallPx);
      vec2 fallVel = vec2(0.0, 1.2 * fallPx / qf * (1.0 - qf));
      float t2 = t * t;
      float t3 = t2 * t;
      pos = (2.0 * t3 - 3.0 * t2 + 1.0) * fallEnd
        + (t3 - 2.0 * t2 + t) * fallVel
        + (3.0 * t2 - 2.0 * t3) * slot;
    }
    float turned = smoothstep(qf, 1.0, q);
    alpha = smoothstep(0.0, 0.08, q) * mix(0.75, aLit, turned);
    tcol = mix(mix(0.62, 0.55, uTheme), shaded, turned);
  } else if (fromPool && q < 1.0) {
    // Out of the hero pool: from somewhere on what is left of its surface, along it to the
    // near edge, over the edge and down into the mould. The curve's bend is kept between
    // the start and the slot, so a droplet never dips below where it is going.
    float u0 = poolLipU(pos.x) + (r4 - 0.5) * 0.05;
    vec2 p0 = poolSurface(u0, r3 * uPoolLeft);
    vec2 lip = poolSurface(u0, 0.0);
    vec2 bend = vec2(lip.x, clamp(lip.y, min(p0.y, pos.y), max(p0.y, pos.y)));
    float e = q * q * (3.0 - 2.0 * q);
    pos = mix(mix(p0, bend, e), mix(bend, pos, e), e);
    alpha = smoothstep(0.0, 0.06, q) * mix(1.0, aLit, q);
    tcol = mix(mix(0.8, 0.6, uTheme), shaded, q);
  } else {
    // From above the screen, through the empty mould.
    alpha = smoothstep(0.0, 0.12, q) * mix(1.0, aLit, q);
    tcol = mix(0.95, shaded, q);
    if (q < 1.0) {
      pos.y = mix(startY, pos.y, q * q);
      pos.x += (1.0 - q) * sin(r4 * 6.2831 + uTime * 2.0) * 5.0;
    }
  }

  // Liquid morph: the same droplets slump into a glowing puddle under the shapes (a lens
  // of liquid with a rippling top), then rise out of it into the next shape.
  bool morphing = t1 > 0.0 && t2 < 1.0;
  if (morphing) {
    vec2 slotA = slotOf(aTarget, uScale) + wobble;
    vec2 slotB = slotOf(aTargetB, uScaleB) + wobble;
    float px = uCenter.x + (mix(slotA.x, slotB.x, 0.5) - uCenter.x) * 0.9;
    float xr = (px - uCenter.x) / max(uPuddleW, 1.0);
    float lens = sqrt(max(1.0 - xr * xr, 0.0));
    vec2 puddle = vec2(
      px,
      uPuddleY + uOffset * 1.15 - lens * uPuddleT * (0.15 + 0.85 * r2)
        + sin(px * 0.035 + uTime * 2.4) * 2.5 * lens
    );
    // Rising starts from wherever the droplet is on its way down (not the puddle), so a
    // droplet that starts rising before it has fully slumped never jumps.
    vec2 fromA = mix(slotA, puddle, t1 * t1);
    if (onB) {
      float e = 1.0 - (1.0 - t2) * (1.0 - t2);
      pos = mix(fromA, slotB, e);
      tcol = mix(mix(0.8, 0.55, uTheme), tcol, e);
    } else {
      pos = fromA;
      tcol = mix(tcol, mix(0.8, 0.55, uTheme), t1);
    }
  }

  bool held = q >= 1.0 && uRelease <= 0.0 && !morphing;
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

#ifdef MIRROR
  // The reflection in the bottom pool: mirrored about its surface line, squashed by the
  // low viewing angle, broken by the swell into shimmering bands, fading with depth.
  // Only what is above the surface reflects.
  float above = uMirrorY - pos.y;
  alpha *= step(0.0, above);
  pos.y = uMirrorY + above * 0.6;
  pos.x += sin(pos.y * 0.09 + uTime * 2.2) * (2.0 + above * 0.02)
    + snoise(vec3(pos * 0.02, uTime * 0.5)) * 3.0;
  alpha *= uReflect * 0.45
    * (1.0 - smoothstep(0.0, uViewport.y * 0.3, above * 0.6))
    * (0.55 + 0.45 * sin(pos.y * 0.6 + uTime * 3.0));
#endif

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
  /** The same particles, mirrored into the bottom pool. */
  mirror: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  mirrorMaterial: THREE.ShaderMaterial;
  target: THREE.BufferAttribute;
  shade: THREE.BufferAttribute;
  targetB: THREE.BufferAttribute;
  shadeB: THREE.BufferAttribute;
  /** Shapes uploaded as A and B (indices into SHAPES), -1 when none. */
  shape: number;
  shapeB: number;
  off: number;
  offV: number;
}

/** v depth of the hero pool band that is still pouring over its edge (see POOL_VERT). */
const POUR_V = 0.18;

/** The hero pool's slow drain ends at this share of the hero's scroll... */
const DRAIN_SLOW_END = 0.55;
/** ...and the rest has poured into the falls by this one. */
const DRAIN_END = 0.7;
/** Share of the first shape's (longer) turn spent forming it. */
const FIRST_POUR = 0.55;

/** Cubic Hermite from (x0, y0, slope m0) to (x1, y1, slope m1); clamped outside. */
function hermite(
  x: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  m0: number,
  m1: number,
): number {
  const w = x1 - x0;
  const t = clamp((x - x0) / w, 0, 1);
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * w * m0 +
    (3 * t2 - 2 * t3) * y1 +
    (t3 - t2) * w * m1
  );
}

/**
 * The story's scroll layout (px of scroll). It starts as the hero pool runs dry. The first
 * shape's turn is `firstSlot` times longer than the others (it is formed out of the falls,
 * which takes a while); the rest share what is left of the page evenly.
 */
function storyLayout(
  f: FrameState,
  n: number,
  firstSlot: number,
  startExit: number,
) {
  const s = f.sections;
  const heroH = Math.max(1, s.heroBottom - s.heroTop);
  const start = s.heroTop + heroH * startExit;
  const units = n - 1 + firstSlot;
  const end = Math.max(start + units * f.H * 0.3, s.docH - f.H);
  const unit = (end - start) / units;
  return {
    unit,
    /** Where shape k's turn starts. */
    at: (k: number) => start + (k === 0 ? 0 : (firstSlot + k - 1) * unit),
    /** How long shape k's turn is. */
    len: (k: number) => (k === 0 ? firstSlot : 1) * unit,
  };
}

/**
 * Sorts a shape's targets bottom-to-top (in bands, left to right within a band), then
 * applies one permutation shared by every shape. Particle j is then the same rank in every
 * shape (so a morph pairs bottom with bottom, left with left), while any prefix of the
 * buffer is still an even subsample (the quality governor draws prefixes).
 */
function pairForMorph(t: ShapeTargets, perm: Uint32Array): ShapeTargets {
  const count = t.count;
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < count; i++) {
    minX = Math.min(minX, t.points[i * 4]);
    maxX = Math.max(maxX, t.points[i * 4]);
  }
  const key = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    key[i] =
      Math.floor(t.points[i * 4 + 2] * 40) +
      ((t.points[i * 4] - minX) / (maxX - minX + 1e-6)) * 0.999;
  }
  const order = Array.from({ length: count }, (_, i) => i).sort(
    (a, b) => key[a] - key[b],
  );
  const points = new Float32Array(count * 4);
  const shade = new Float32Array(count * 4);
  for (let j = 0; j < count; j++) {
    const src = order[perm[j]] * 4;
    points.set(t.points.subarray(src, src + 4), j * 4);
    shade.set(t.shade.subarray(src, src + 4), j * 4);
  }
  return { ...t, points, shade };
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

  const dynamicAttr = () => {
    const attr = new THREE.BufferAttribute(new Float32Array(capacity * 4), 4);
    attr.setUsage(THREE.DynamicDrawUsage);
    return attr;
  };

  const makeLayer = (): Layer => {
    const target = dynamicAttr();
    const shade = dynamicAttr();
    const targetB = dynamicAttr();
    const shadeB = dynamicAttr();
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
    geometry.setAttribute("aTargetB", targetB);
    geometry.setAttribute("aShadeB", shadeB);
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    // One uniforms object for the shape and its reflection, so they never drift apart.
    const uniforms: Record<string, THREE.IUniform> = {
      ...ctx.common,
      uCenter: { value: new THREE.Vector2() },
      uScale: { value: 100 },
      uScaleB: { value: 100 },
      uStretch: { value: new THREE.Vector2(1, 1) },
      uOffset: { value: 0 },
      uForm: { value: 0 },
      uRelease: { value: 0 },
      uMorphOn: { value: 0 },
      uMorph: { value: 0 },
      uPuddleY: { value: 0 },
      uPuddleW: { value: 1 },
      uPuddleT: { value: 1 },
      uSplash: { value: 0 },
      uLandY: { value: 0 },
      uWobble: { value: 2.5 },
      uGlint: { value: 1 },
      uDrips: { value: 1 },
      uClock: { value: 0 },
      uSize: { value: 2.4 },
      uAlphaK: { value: 0.5 },
      uLight: { value: new THREE.Vector3(0, 0.6, 0.8) },
      uMirrorY: { value: 0 },
      uReflect: { value: 0 },
      uFirstFrom: { value: 0 },
      uPoolLeft: { value: 1 },
      uFallTop: { value: 0 },
      uFallFirst: { value: 0.45 },
      // The hero pool's own uniforms, so poolSurface() always matches what it draws.
      ...poolSurfaceUniforms(ctx.topPool),
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: SHAPE_VERT,
      fragmentShader: SPRITE_FRAG,
      ...particleBlending,
    });
    const mirrorMaterial = new THREE.ShaderMaterial({
      uniforms,
      defines: { MIRROR: "" },
      vertexShader: SHAPE_VERT,
      fragmentShader: SPRITE_FRAG,
      ...particleBlending,
    });
    const points = new THREE.Points(geometry, material);
    const mirror = new THREE.Points(geometry, mirrorMaterial);
    for (const p of [points, mirror]) {
      p.frustumCulled = false;
      p.visible = false;
    }
    points.renderOrder = 2;
    mirror.renderOrder = 1;
    group.add(mirror, points);
    return {
      points,
      mirror,
      geometry,
      material,
      mirrorMaterial,
      target,
      shade,
      targetB,
      shadeB,
      shape: -1,
      shapeB: -1,
      off: 0,
      offV: 0,
    };
  };
  const layers: [Layer, Layer] = [makeLayer(), makeLayer()];

  // One shared permutation pairs every shape's droplets (see pairForMorph).
  const perm = new Uint32Array(capacity);
  for (let i = 0; i < capacity; i++) perm[i] = i;
  for (let i = capacity - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = perm[i];
    perm[i] = perm[j];
    perm[j] = t;
  }

  // Shapes are sampled once the site's fonts are in (text shapes draw with them).
  let targets: ShapeTargets[] | null = null;
  let disposed = false;
  void loadFonts(ctx.fonts).then(() => {
    if (disposed) return;
    targets = SHAPES.map((spec) =>
      pairForMorph(sampleShape(spec, capacity, ctx.fonts), perm),
    );
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
  // The hero pool's drain: `drain` is where its back edge is as a share of its depth on
  // screen (0 full .. 1 at the near edge .. 1 + POUR_V empty); `drainV` is the same in the
  // pool's own depth units, which the shaders use. Plus its surface current.
  let drain = 0;
  let drainV = 0;
  let current = 0;
  const glowColor = new THREE.Color();
  const rampD = ctx.common.uRampD.value as THREE.Color[];
  const glowSpecs: GlowSpec[] = [];

  const upload = (layer: Layer, a: number, b: number) => {
    if (layer.shape !== a) {
      (layer.target.array as Float32Array).set(targets![a].points);
      (layer.shade.array as Float32Array).set(targets![a].shade);
      layer.target.needsUpdate = layer.shade.needsUpdate = true;
      layer.shape = a;
    }
    if (b >= 0 && layer.shapeB !== b) {
      (layer.targetB.array as Float32Array).set(targets![b].points);
      (layer.shadeB.array as Float32Array).set(targets![b].shade);
      layer.targetB.needsUpdate = layer.shadeB.needsUpdate = true;
      layer.shapeB = b;
    }
  };

  const hide = (layer: Layer) => {
    layer.points.visible = false;
    layer.mirror.visible = false;
  };

  return {
    key: "form",
    object: group,

    update(f) {
      const p = f.params.form;
      const L = f.params.common.liquid;
      const P = f.params.common.pools;
      clock += f.dt;

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

      const pinned = SHAPES.findIndex((s) => s.key === p.shape);
      const morph = p.handover === "morph" && !f.reduced && pinned < 0;
      // Where the first shape comes from: 2 the falls, 1 the hero pool, 0 above.
      const firstFrom =
        f.reduced || pinned >= 0
          ? 0
          : p.firstFrom === "pool"
            ? 1
            : p.firstFrom === "above"
              ? 0
              : 2;
      const layout = storyLayout(
        f,
        n,
        Math.max(1, p.firstSlot),
        firstFrom === 1 ? DRAIN_SLOW_END : DRAIN_END,
      );
      const { at, len, unit } = layout;
      // The first shape's pour-in, scrubbed (0..1).
      const form0 = clamp((y - at(0)) / (FIRST_POUR * len(0)), 0, 1);

      // One liquid. The hero pool empties, scrubbed: while the hero scrolls away it slides
      // over its near edge and pours into the falls, slowly at first (poolToFalls of it),
      // then the rest. Out of the pool (round 6), that rest pours into the first shape
      // instead. Scroll back and it refills.
      const s = f.sections;
      const heroH = Math.max(1, s.heroBottom - s.heroTop);
      const toFalls = clamp(p.poolToFalls, 0, 1);
      const exit = (y - s.heroTop) / heroH;
      const rest = 1 + POUR_V - toFalls;
      // One smooth curve: the slow stage hands its speed to the fast one (no stall where
      // they meet), and the last of the pool rushes out at the end.
      const e0 = 0.02;
      const e1 = DRAIN_SLOW_END;
      const seam = Math.min(
        (1.2 * toFalls) / (e1 - e0),
        (2.5 * rest) / (DRAIN_END - e1),
      );
      const slow = hermite(exit, e0, e1, 0, toFalls, 0, seam);
      drain = f.reduced
        ? 1 + POUR_V // the static frame hides the hero pool: the falls come from above
        : firstFrom === 1
          ? slow + rest * form0 // round 6: the rest pours into the first shape
          : exit <= e1
            ? slow
            : hermite(exit, e1, DRAIN_END, toFalls, 1 + POUR_V, seam, 0);
      // Perspective crowds the far half of the pool into a thin strip at its horizon, so a
      // drain linear in depth would show nothing for a long while and then rush. Drain
      // linearly on screen instead: the back edge recedes evenly as you scroll.
      const D = P.heroDepth;
      drainV =
        drain <= 1
          ? 1 - (1 / (drain * (1 - 1 / D) + 1 / D) - 1) / (D - 1)
          : drain;
      current += f.dt * 70 * smoothstep(0, 0.05, drain);
      const span = Math.max(1, f.landY - f.sourceY);
      ctx.topPool.setSpill({
        drain: drainV,
        pourV: POUR_V,
        pourPx: Math.min(span * 0.55, f.H * 0.35),
        current: current % 1e5,
      });

      // The falls grow out of that pour (cross-fading with the pool's own pouring
      // particles below its edge). Once the pool is dry, their top leaves its edge for the
      // top of the screen.
      const dry = smoothstep(1, 1 + POUR_V, drain);
      sheetParams.veil = Math.max(p.veil, shapeVeil);
      sheetParams.veilWidth = Math.max(p.veilWidth, shapeVeilW);
      sheetParams.mist = p.mist;
      sheetParams.sway = p.sway;
      sheetParams.thinning = p.thinning;
      sheetParams.fadeIn = lerp(0.2, 0.03, dry);
      sheet.update({
        ...f,
        pour: f.pour * smoothstep(0, 0.25, drain),
        sourceY: lerp(f.sourceY, -40, dry),
        params: { ...f.params, cascade: sheetParams },
      });
      shapeVeil = 0;
      shapeVeilW = 0;
      glowSpecs.length = 0;
      label = "";

      if (!targets) return;
      const shapes = targets;
      // (Out of the pool: once its edge has scrolled off the top, the droplets simply come
      // in from above the screen along the same path, so the source never switches.)
      const first = firstFrom;
      const poolLeft = clamp(1 - drainV, 0, 1);
      const fallTop = lerp(f.sourceY, -40, dry);
      // Sets where layer `l`'s pour-in comes from (only a first pour has a choice).
      const setFirst = (l: Layer, isFirst: boolean) => {
        const u = l.material.uniforms;
        u.uFirstFrom.value = isFirst ? first : 0;
        u.uPoolLeft.value = poolLeft;
        u.uFallTop.value = fallTop;
        u.uFallFirst.value = p.fallFirst;
      };

      // A hard fling bursts the shapes; they gather again as the scroll slows.
      const fling = f.reduced
        ? 0
        : clamp((Math.abs(f.velN) - 0.5) / 2, 0, 1) * p.splash;
      splash = snap
        ? fling
        : damp(splash, fling, fling > splash ? 14 : 2.2, f.dt);

      // Melted liquid (and drips) vanish into the hero pool while it is on screen below
      // the shape, otherwise into the bottom pool.
      const heroHorizon = s.heroTop + heroH * P.heroHorizon - f.scrollY;
      const heroNear = s.heroBottom + heroH * 0.06 - f.scrollY;
      const heroLand =
        heroNear > 0
          ? heroHorizon + (heroNear - heroHorizon) * 0.3
          : Number.POSITIVE_INFINITY;
      // The bottom pool's surface (same as the engine's) is the reflections' mirror.
      const level = f.poolT * P.poolMax * f.H;
      const mirrorY = f.H - level;
      const reflect = p.reflect * smoothstep(2, 24, level);

      const follow = springConstants(L.response, L.damping);
      const sub = Math.max(1, Math.ceil(f.dt / (1 / 120)));
      const hStep = f.dt / sub;
      const a = clock * 0.35;
      const cx = f.W / 2;
      const cy = f.H * p.shapeY;
      const scaleOf = (k: number) =>
        Math.min(f.H * 0.4, (f.W * 0.84) / Math.max(0.2, shapes[k].aspect)) *
        p.shapeSize;

      // Shared per-layer state: the follow spring, light, splash, pointer, reflection.
      const drive = (l: Layer, landBelow: number) => {
        if (snap) {
          l.off = l.offV = 0;
        } else {
          // The page drags the liquid along, a spring brings it back (with a wobble).
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
        (u.uStretch.value as THREE.Vector2).set(
          1 / Math.sqrt(stretch),
          stretch,
        );
        u.uOffset.value = l.off;
        u.uSplash.value = splash;
        u.uLandY.value =
          heroLand > landBelow ? Math.min(heroLand, f.landY) : f.landY;
        u.uWobble.value = f.reduced ? 0 : p.wobble;
        u.uGlint.value = p.glint;
        u.uDrips.value = f.reduced ? 0 : p.drips;
        u.uClock.value = clock;
        // The light orbits slowly, so highlights glide over the liquid.
        (u.uLight.value as THREE.Vector3)
          .set(Math.cos(a) * 0.55, 0.5 + 0.2 * Math.sin(a * 0.7), 0.75)
          .normalize();
        u.uMirrorY.value = mirrorY;
        u.uReflect.value = reflect;
        l.points.visible = true;
        l.mirror.visible = reflect > 0.01;
      };

      const glowFor = (
        l: Layer,
        width: number,
        height: number,
        intensity: number,
        y0 = cy,
      ) => {
        glowColor.copy(rampD[1]).lerp(rampD[2], 0.3);
        glowSpecs.push({
          x: cx,
          y: y0 + l.off,
          rx: width * 0.5 + 60,
          ry: height * 0.75 + 40,
          color: glowColor,
          intensity: 0.6 * p.shapeGlow * intensity,
        });
        if (p.sheetVeil * intensity > shapeVeil) {
          shapeVeil = p.sheetVeil * intensity;
          shapeVeilW = Math.min(1, (width / f.W) * 1.15);
        }
      };

      if (morph) {
        // Which hand-over the story is in: pair k -> k + 1, progress M. Before the first
        // hand-over, the first shape pours in (out of the hero pool); after the last, it
        // holds.
        let pair = 0;
        let M = 0;
        for (let k = 0; k < n - 1; k++) {
          const m0 = at(k + 1) - 0.45 * p.meltLen * unit;
          const m1 = at(k + 1) + p.pourLen * unit;
          if (y >= m0) {
            pair = k;
            M = clamp((y - m0) / (m1 - m0), 0, 1);
          }
        }
        const pour = form0;
        const l = layers[0];
        hide(layers[1]);
        for (let k = 0; k < n; k++) lastRelease[k] = 0;
        if (pour <= 0) {
          hide(l);
          label =
            drain < 0.01
              ? ""
              : drain < 1 + POUR_V - 0.005
                ? `pool pouring ${Math.round((drain / (1 + POUR_V)) * 100)}%`
                : "falls";
        } else {
          upload(l, pair, Math.min(pair + 1, n - 1));
          const scaleA = scaleOf(pair);
          const scaleB = scaleOf(Math.min(pair + 1, n - 1));
          const wA = scaleA * shapes[pair].aspect;
          const wB = scaleB * shapes[Math.min(pair + 1, n - 1)].aspect;
          // The puddle either gathers under the shapes, or (puddle: "pool") the liquid
          // dives into the lake below and the next shape rises out of it.
          const intoPool = p.puddle === "pool" && level > 2;
          const puddleY = intoPool
            ? Math.max(mirrorY + 4, cy + 0.5 * Math.max(scaleA, scaleB))
            : cy + 0.5 * Math.max(scaleA, scaleB) + 12;
          drive(l, puddleY);
          const u = l.material.uniforms;
          u.uScale.value = scaleA;
          u.uScaleB.value = scaleB;
          u.uForm.value = pair === 0 && M === 0 ? pour : 1;
          setFirst(l, pair === 0 && M === 0);
          u.uRelease.value = 0;
          u.uMorphOn.value = 1;
          u.uMorph.value = M;
          u.uPuddleY.value = puddleY;
          u.uPuddleW.value = 0.5 * Math.max(wA, wB) * (intoPool ? 1.5 : 0.95);
          u.uPuddleT.value =
            (intoPool ? 0.05 : 0.09) * Math.max(scaleA, scaleB);

          // The light follows the liquid down into the puddle and back up.
          const puddled =
            smoothstep(0.15, 0.45, M) * (1 - smoothstep(0.55, 0.85, M));
          const formed = pair === 0 && M === 0 ? smoothstep(0.2, 1, pour) : 1;
          const width = M < 0.5 ? wA : wB;
          const height = M < 0.5 ? scaleA : scaleB;
          glowFor(
            l,
            width + (Math.max(wA, wB) - width) * puddled,
            height * (1 - 0.8 * puddled),
            formed * (1 + 0.3 * puddled),
            cy + (puddleY - cy) * puddled,
          );
          const from = SHAPES[pair].key;
          const to = SHAPES[Math.min(pair + 1, n - 1)].key;
          const pourLabel = `${["above", "pool", "falls"][first]} -> ${from} ${Math.round(pour * 100)}%`;
          label =
            M <= 0
              ? pour < 1
                ? pourLabel
                : `${from} holding`
              : M >= 1
                ? `${to} holding`
                : `${from} -> ${to} ${Math.round(M * 100)}%`;
        }
        return;
      }

      // Melt mode (and reduced motion / a pinned shape): pour in over the first part of
      // each slot, melt out across the end of it (overlapping the next shape's pour); the
      // last one never melts.
      for (let k = 0; k < n; k++) {
        const s0 = at(k);
        release[k] = 0;
        if (pinned >= 0) {
          form[k] = k === pinned ? 1 : 0;
        } else if (f.reduced) {
          // No pours or melts under reduced motion: the slot's shape, simply there.
          const inSlot = y >= s0 && (y < s0 + len(k) || k === n - 1);
          form[k] = inSlot || (k === 0 && y < s0) ? 1 : 0;
        } else {
          form[k] =
            k === 0 ? form0 : clamp((y - s0) / (p.pourLen * unit), 0, 1);
          if (k < n - 1) {
            const m0 = s0 + len(k) - 0.45 * p.meltLen * unit;
            release[k] = clamp((y - m0) / (p.meltLen * unit), 0, 1);
          }
        }
      }

      const shown = [false, false];
      for (let k = 0; k < n; k++) {
        const dR = release[k] - lastRelease[k];
        lastRelease[k] = release[k];
        if (form[k] <= 0 || release[k] >= 1) continue;
        const l = layers[k % 2];
        upload(l, k, -1);
        shown[k % 2] = true;
        const scale = scaleOf(k);
        drive(l, cy + scale * 0.6);
        const u = l.material.uniforms;
        u.uScale.value = scale;
        u.uForm.value = form[k];
        setFirst(l, k === 0);
        u.uRelease.value = release[k];
        u.uMorphOn.value = 0;
        u.uMorph.value = 0;

        // Light behind the shape, so the silhouette glows like the pools do.
        const formed =
          smoothstep(0.2, 1, form[k]) * (1 - smoothstep(0, 0.7, release[k]));
        const shapeW = scale * shapes[k].aspect;
        glowFor(l, shapeW, scale, formed);
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
        if (!shown[i]) hide(layers[i]);
      }
    },

    extraGlows(out) {
      for (const g of glowSpecs) out.push(g);
    },

    debug: () => ({ story: label || "pool (no shape)" }),

    poolDrain: () => drain,

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
          ((l.points.visible ? 1 : 0) + (l.mirror.visible ? 1 : 0)) *
            Math.min(capacity, l.geometry.drawRange.count),
        0,
      ),

    dispose() {
      disposed = true;
      // The hero pool belongs to the engine: put it back to rest for the next variant.
      ctx.topPool.setSpill(null);
      sheet.dispose();
      for (const l of layers) {
        l.geometry.dispose();
        l.material.dispose();
        l.mirrorMaterial.dispose();
      }
    },
  };
}
