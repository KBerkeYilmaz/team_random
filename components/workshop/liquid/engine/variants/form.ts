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
// Round 9: the four pillars (Design, Build, Scale, Advise) + contact, with their copy as
// real text beside each shape (PillarCopy) and the glass pill nav (WorkshopNav). This
// variant drives both: each copy block's --show, html[data-lw-beat] and __lwBeats.
// Round 7: "it should fall a little bit before turning into the code shape ... not from
// the actual pool ... pool, a couple of seconds going on, to turn into code": the pool
// pours out completely into the falls first; then, after a stretch of just falls, falling
// droplets bend out of the falls into the first shape. (Out of the pool, round 6, and
// from above, round 4, stay as panel options.)
// Round 10: "scroll movements can be a bit slicker it feels a bit instant", then "more
// breathing room between the scroll movements and transitions". Each beat now gets its
// own length of scroll (beatLen screens; the page grows to fit, via --lw-track on main),
// most of it a hold where the formed shape just sits there; the story spring is heavier;
// and the copy no longer fades with the scrub: each block plays a timed entrance as its
// shape settles and a timed exit as its hand-over starts (data-state: in, or the side it
// rests on, above or below, so it always leaves and returns the way the scroll goes).
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

import { BEATS } from "../../story";
import { NOISE, PARTICLE_COMMON, SPRITE_FRAG } from "../glsl";
import type { CascadeParams } from "../params";
import {
  POOL_SURFACE_GLSL,
  particleBlending,
  poolSurfaceUniforms,
} from "../pool";
import { clamp, damp, lerp, smoothstep, springConstants } from "../scroll";
import {
  SERVICE_SHAPES,
  SHAPES,
  loadFonts,
  sampleShape,
  type ShapeTargets,
} from "../shapes";

import { createCascade } from "./cascade";
import type {
  FrameState,
  GlowSpec,
  Impact,
  SnapStory,
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
uniform float uCursorLight; // 0..1: the pointer carries a light (round 11)
uniform vec4 uGrab;       // round 11, pull: xy the grabbed spot (px), zw how far it is pulled
uniform float uGrabR;     // the grab's reach (px); 0 when nothing is held or springing back
uniform float uGrip;      // round 12: 0..1, eased, how firmly the mouse holds the liquid
uniform float uFlow;      // round 11: 0..1, the liquid flows straight from shape A into B (hover)
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
  // Round 11, hover flow: droplets set off in order of where they land in B, bottom first
  // (so B fills from the bottom up like a pour, and flowing back drains it from the top),
  // and fly straight there (no puddle), swirling a little on the way.
  float tf = uFlow > 0.0
    ? clamp((uFlow - 0.5 * aTargetB.z - 0.1 * r1) / 0.4, 0.0, 1.0)
    : 0.0;
  bool flowing = tf > 0.0 && tf < 1.0;
  bool onB = t2 > 0.0 || tf >= 0.5;
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
  // Round 11, the cursor light: while a mouse is about, each droplet is lit from the
  // pointer (a light hovering just above the page), so the liquid glints where you point,
  // brightest close to it. It hands back to the orbiting light when the mouse rests.
  vec3 L = uLight;
  float near = 0.0;
  if (uCursorLight > 0.0) {
    vec2 toP = (uPointer.xy - pos) * vec2(1.0, -1.0);
    L = normalize(mix(uLight, normalize(vec3(toP / 240.0, 0.6)), uCursorLight));
    near = exp(-dot(toP, toP) / (260.0 * 260.0)) * uCursorLight;
  }
  float diff = max(dot(nrm, L), 0.0);
  float spec = pow(max(dot(nrm, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 28.0)
    * uGlint * (1.0 + 1.5 * near);
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

  if (flowing) {
    vec2 a = slotOf(aTarget, uScale) + wobble;
    vec2 b = slotOf(aTargetB, uScaleB) + wobble;
    float e = tf * tf * (3.0 - 2.0 * tf);
    vec2 d = b - a;
    vec2 side = vec2(-d.y, d.x) * (r4 - 0.5) * 0.18;
    vec2 swirl = vec2(
      snoise(vec3(a * 0.01, uTime * 0.7 + r2 * 5.0)),
      snoise(vec3(a * 0.01 + 7.0, uTime * 0.7))
    ) * 10.0;
    pos = mix(a, b, e) + (side + swirl) * sin(3.14159 * e);
    tcol = mix(tcol, mix(0.85, 0.55, uTheme), sin(3.14159 * e) * 0.6);
  }

  bool held = q >= 1.0 && uRelease <= 0.0 && !morphing && !flowing;
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

  // The pointer parts the liquid and warms it where it touches (not while it holds it).
  vec2 dp = pos - uPointer.xy;
  float touch = exp(-dot(dp, dp) / (120.0 * 120.0)) * uPointer.z * (1.0 - uGrip);
  pos += normalize(dp + 1e-4) * touch * 48.0;
  tcol += touch * 0.3 * (1.0 - uTheme);

  // Round 11, pull the liquid: the grabbed spot follows the pointer and the liquid around
  // it strings out after it (the closer a droplet, the further it follows), thinning as
  // the strand lengthens, like surface tension rounding it in. Let go and the pull
  // springs back past rest and wobbles out.
  if (uGrabR > 0.0) {
    vec2 rel = pos - uGrab.xy;
    float w = exp(-dot(rel, rel) / (uGrabR * uGrabR));
    // Round 12 ("hover and pull snap between, connect the two"): the grip. As the mouse
    // closes on the liquid, what it had parted flows back and gathers under it (a pinch);
    // as it lets go, the pinch relaxes. The grip eases both ways, crossfading with the
    // parting above, so hovering, grabbing and letting go read as one motion.
    pos -= rel * w * 0.3 * uGrip;
    float len = length(uGrab.zw);
    if (len > 0.5) {
      vec2 dir = uGrab.zw / len;
      pos += uGrab.zw * w;
      vec2 lateral = rel - dot(rel, dir) * dir;
      pos -= lateral * w * clamp(len / (uGrabR * 3.0), 0.0, 0.7);
      tcol += w * min(len / 200.0, 1.0) * 0.18 * (1.0 - uTheme);
    }
  }

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
/** Share of the first shape's (longer) turn spent forming it (round 10: was 0.55). */
const FIRST_POUR = 0.5;
/**
 * Round 12 ("transition between pool and the first icon is still a bit abrupt"), out of
 * the falls (the default): the pool drains in one even, eased stretch of the hero's
 * scroll, from DRAIN_FROM to DRAIN_TO (the old curve rushed most of it out at the end and
 * then left a long empty stretch)...
 */
const DRAIN_FROM = 0.03;
const DRAIN_TO = 0.88;
/** ...and the first shape starts gathering out of the falls while the pool still pours. */
const FIRST_START = 0.5;
/** ...and the story is heavier through that intro, so even a flick plays it through... */
const INTRO_SCRUB = 0.95;
/** ...at most this many screens per second (a soft limit), however fast the page goes. */
const INTRO_MAX_SPEED = 0.9;

/** The story's beats for the page (WorkshopNav scrolls to these). */
type StoryGlobal = typeof globalThis & { __lwBeats?: Record<string, number> };

/** The furthest the page can scroll. */
function s0Max(f: FrameState): number {
  return f.sections.docH - f.H;
}

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
 * which takes a while). With `beatLen` (round 10) every turn is that many screens long and
 * the page grows to fit; without it (site content shown) the turns share what is left of
 * the page evenly.
 */
function storyLayout(
  f: FrameState,
  n: number,
  firstSlot: number,
  startExit: number,
  beatLen: number | null,
) {
  const s = f.sections;
  const heroH = Math.max(1, s.heroBottom - s.heroTop);
  const start = s.heroTop + heroH * startExit;
  const units = n - 1 + firstSlot;
  const unit =
    beatLen !== null
      ? beatLen * f.H
      : (Math.max(start + units * f.H * 0.3, s.docH - f.H) - start) / units;
  return {
    unit,
    /** Where the story ends: the last shape holds from its turn to here. */
    end: start + units * unit,
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
      uCursorLight: { value: 0 },
      uGrab: { value: new THREE.Vector4() },
      uGrabR: { value: 0 },
      uGrip: { value: 0 },
      uFlow: { value: 0 },
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
  // Round 11: each service's shape (hover), sampled one per idle moment after the
  // pillars, so the page never stalls on them.
  const serviceTargets: (ShapeTargets | null)[] = SERVICE_SHAPES.map(
    () => null,
  );
  const idle = (fn: () => void) => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(fn, { timeout: 400 });
    } else setTimeout(fn, 50);
  };
  const sampleServices = (j: number) => {
    if (disposed || j >= SERVICE_SHAPES.length) return;
    serviceTargets[j] = pairForMorph(
      sampleShape(SERVICE_SHAPES[j], capacity, ctx.fonts),
      perm,
    );
    idle(() => sampleServices(j + 1));
  };
  void loadFonts(ctx.fonts).then(() => {
    if (disposed) return;
    targets = SHAPES.map((spec) =>
      pairForMorph(sampleShape(spec, capacity, ctx.fonts), perm),
    );
    idle(() => sampleServices(0));
  });

  const n = SHAPES.length;
  /**
   * A shape by index: 0..n-1 the story's pillars (SHAPES), n + j service j (round 11,
   * SERVICE_SHAPES), null until sampled.
   */
  const targetsAt = (k: number) =>
    k < n ? (targets?.[k] ?? null) : (serviceTargets[k - n] ?? null);
  const keyOf = (k: number) =>
    k < n ? SHAPES[k].key : (SERVICE_SHAPES[k - n]?.key ?? "?");
  /** Which pillar each service belongs to (story.ts), and its index in SERVICE_SHAPES. */
  const SERVICE_OF = new Map<string, { j: number; pillar: number }>();
  BEATS.forEach((beat, pillar) => {
    for (const service of beat.services) {
      const j = SERVICE_SHAPES.findIndex((spec) => spec.key === service.key);
      if (j >= 0) SERVICE_OF.set(service.key, { j, pillar });
    }
  });
  // The hover flow (round 11): the layer flows from shape `a` to shape `b`, t of the way.
  // `base` is the pillar it started from, which it always returns to before handing back.
  const flow = { a: -1, b: -1, t: 0, base: -1 };
  // Round 12: a hovered service's shape stays while the pointer travels from the list to
  // the shape (to pull it, say) and while it is held; the hover only ends once the
  // pointer has been off both for a moment.
  const latch = { key: "", until: 0 };
  // After a flow hands back mid hand-over, the morph eases up to where the scroll already
  // is instead of jumping there (0 just handed back .. 1 caught up).
  let morphCatch = 1;
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

  // The page reads the story from here: each copy block's data-state (PillarCopy: "in",
  // or the side it rests on, "above" once the story has passed it, else "below"; CSS plays
  // the timed entrances and exits), the current beat (html[data-lw-beat], the nav's
  // droplet) and the scroll position where each beat holds (globalThis.__lwBeats, the
  // nav's link targets). Plus, round 10, the story's length (--lw-track: the page grows to
  // fit it).
  const html = document.documentElement;
  const copyState: string[] = new Array(n).fill("below");
  const copyEls: (HTMLElement | null)[] = new Array(n).fill(null);
  const lastCopy: string[] = new Array(n).fill("");
  let activeCopy = -1;
  let lastBeat = "";
  let lastTrack = 0;
  const beatsY: Record<string, number> = {};
  (globalThis as StoryGlobal).__lwBeats = beatsY;
  // Round 11: where the scroll should come to rest (engine/smooth.ts): each pillar's hold
  // point and its free zone (shape fully formed, no hand-over started).
  const snapPoints: number[] = new Array(n).fill(0);
  const snapZones: [number, number][] = Array.from(
    { length: n },
    () => [0, 0] as [number, number],
  );
  let snapStory: SnapStory | null = null;
  const syncPage = (beat: string, states: readonly string[] | null) => {
    for (let k = 0; k < n; k++) {
      let el = copyEls[k];
      if (!el || !el.isConnected) {
        el = document.querySelector<HTMLElement>(
          `[data-lw-copy="${SHAPES[k].key}"]`,
        );
        copyEls[k] = el;
        lastCopy[k] = "";
      }
      if (!el) continue;
      const state = states ? states[k] : "";
      if (state === lastCopy[k]) continue;
      if (state) el.dataset.state = state;
      else delete el.dataset.state;
      lastCopy[k] = state;
    }
    if (beat !== lastBeat) {
      html.dataset.lwBeat = beat;
      lastBeat = beat;
    }
  };
  const setTrack = (px: number) => {
    if (Math.abs(px - lastTrack) < 1) return;
    if (px > 0) html.style.setProperty("--lw-track", `${px}px`);
    else html.style.removeProperty("--lw-track");
    lastTrack = px;
  };

  // Round 11, pull the liquid ("doable, let's try it"): press on a formed shape and drag. A
  // mouse or pen only: on a phone the same gesture scrolls the page. `onScreen` is the shape
  // on screen and where (updated every frame), for hit-testing the press.
  const grab = {
    held: false,
    // The grabbed spot, relative to the shape's (moving) centre.
    ax: 0,
    ay: 0,
    // The pointer.
    px: -1e4,
    py: -1e4,
    // The pull vector and its spring.
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    hover: false,
    moved: false,
    // Round 12: how firmly it holds (eased toward 1 while held, back to 0 on release).
    grip: 0,
  };
  const onScreen = { k: -1, cx: 0, cy: 0, scale: 1, off: 0 };
  let lastGrab = "";
  /** Is (x, y) on the liquid of the shape on screen (within a few px of a droplet)? */
  const onShape = (x: number, y: number) => {
    const shape = onScreen.k < 0 ? null : targetsAt(onScreen.k);
    if (!shape) return false;
    const pts = shape.points;
    const sx = (x - onScreen.cx) / onScreen.scale;
    const sy = -(y - onScreen.cy - onScreen.off) / onScreen.scale;
    const r = 22 / onScreen.scale;
    const r2 = r * r;
    // Every third droplet is plenty: they sit a few px apart.
    for (let i = 0; i < pts.length; i += 12) {
      const dx = pts[i] - sx;
      const dy = pts[i + 1] - sy;
      if (dx * dx + dy * dy < r2) return true;
    }
    return false;
  };
  const INTERACTIVE =
    "a, button, input, textarea, select, label, summary, [role='button'], " +
    "[data-lw-panel], [data-lw-nav], .lw-hud, .lw-copy-services";
  const onGrabDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    if ((event.target as Element | null)?.closest?.(INTERACTIVE)) return;
    if (!onShape(event.clientX, event.clientY)) return;
    // No text selection, no native drag.
    event.preventDefault();
    grab.held = true;
    grab.ax = event.clientX - onScreen.cx;
    grab.ay = event.clientY - onScreen.cy - onScreen.off;
    grab.px = event.clientX;
    grab.py = event.clientY;
  };
  const onGrabMove = (event: PointerEvent) => {
    grab.px = event.clientX;
    grab.py = event.clientY;
    grab.moved = event.pointerType === "mouse" || event.pointerType === "pen";
  };
  const onGrabUp = () => {
    grab.held = false;
  };
  window.addEventListener("pointerdown", onGrabDown);
  window.addEventListener("pointermove", onGrabMove, { passive: true });
  window.addEventListener("pointerup", onGrabUp);
  window.addEventListener("pointercancel", onGrabUp);
  const setGrabCursor = (state: string) => {
    if (state === lastGrab) return;
    if (state) html.dataset.lwGrab = state;
    else delete html.dataset.lwGrab;
    lastGrab = state;
  };

  const upload = (layer: Layer, a: number, b: number) => {
    if (layer.shape !== a) {
      (layer.target.array as Float32Array).set(targetsAt(a)!.points);
      (layer.shade.array as Float32Array).set(targetsAt(a)!.shade);
      layer.target.needsUpdate = layer.shade.needsUpdate = true;
      layer.shape = a;
    }
    if (b >= 0 && layer.shapeB !== b) {
      (layer.targetB.array as Float32Array).set(targetsAt(b)!.points);
      (layer.shadeB.array as Float32Array).set(targetsAt(b)!.shade);
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
      // Round 10: on the workshop stage (site content hidden) every beat gets beatLen
      // screens and the page grows to fit; with the old sections shown, the story fits
      // their length as before.
      const tracked = !f.params.common.sections.showContent;
      const layout = storyLayout(
        f,
        n,
        Math.max(1, p.firstSlot),
        firstFrom === 1
          ? DRAIN_SLOW_END
          : firstFrom === 2
            ? FIRST_START
            : DRAIN_END,
        tracked ? Math.max(0.3, p.beatLen) : null,
      );
      const { at, len, unit, end } = layout;
      setTrack(tracked ? Math.ceil(end + f.H) : 0);

      // The story position: the scroll, smoothed so wheel steps and flicks glide. Round 12:
      // heavier until the first shape has formed (blending back over a quarter screen), so
      // the pool -> falls -> first shape handover never plays faster than the liquid can.
      const snap = f.reduced || f.settle || storyY === null || p.scrub < 0.02;
      let y = storyY ?? f.scrollY;
      if (snap) {
        y = f.scrollY;
        storyV = 0;
      } else {
        const formedFirst = at(0) + FIRST_POUR * len(0);
        const intro = clamp((formedFirst - y) / (0.25 * f.H), 0, 1);
        const spring = springConstants(
          lerp(p.scrub, Math.max(p.scrub, INTRO_SCRUB), intro),
          1,
        );
        // The speed limit saturates softly (tanh), so the story eases into its cruise
        // and out of it rather than hitting a wall.
        const vmax = f.H * lerp(8, INTRO_MAX_SPEED, intro);
        const sub = Math.max(1, Math.ceil(f.dt / (1 / 120)));
        const h = f.dt / sub;
        for (let i = 0; i < sub; i++) {
          storyV += (spring.k * (f.scrollY - y) - spring.c * storyV) * h;
          if (intro > 0) storyV = vmax * Math.tanh(storyV / vmax);
          y += storyV * h;
        }
      }
      storyY = y;
      // The first shape's pour-in, scrubbed (0..1).
      const form0 = clamp((y - at(0)) / (FIRST_POUR * len(0)), 0, 1);

      // Per-shape pour-in / melt-out (melt mode draws from these; the copy reads them in
      // every mode), the morph's current pair, and from both: what the page shows.
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
      // Copy (round 10): each block is "in" from just before its shape settles until its
      // hand-over starts; it plays a timed entrance and exit (CSS) instead of following the
      // scrub, so it always arrives with the same composure however fast you scroll. Out
      // of its window it rests on the side the story left it: above once passed, else
      // below. A little hysteresis stops it flickering on a window's edge.
      const maxY = Math.max(0, s0Max(f));
      const firstPour = FIRST_POUR * len(0);
      const handLen = (0.45 * p.meltLen + p.pourLen) * unit;
      const formedAt = (k: number) =>
        k === 0 ? at(0) + firstPour : at(k) + p.pourLen * unit;
      const leaveAt = (k: number) =>
        k < n - 1
          ? at(k + 1) - 0.45 * p.meltLen * unit
          : Number.POSITIVE_INFINITY;
      const enterAt = (k: number) =>
        formedAt(k) - 0.15 * (k === 0 ? firstPour : handLen);
      const exitAt = (k: number) => leaveAt(k) + 0.06 * handLen;
      /** Where beat k holds: halfway through its hold (the nav glides here). */
      const holdAt = (k: number) =>
        Math.min(maxY, (formedAt(k) + Math.min(leaveAt(k), end, maxY)) / 2);
      let copyNow = -1;
      if (f.flood > 0.5) copyNow = -1;
      else if (pinned >= 0) copyNow = pinned;
      else if (f.reduced) {
        copyNow = 0;
        for (let k = 1; k < n; k++) if (y >= at(k)) copyNow = k;
      } else {
        const keep = 0.03 * unit;
        const inside = (k: number, margin: number) =>
          y >= enterAt(k) - margin && y < exitAt(k) + margin;
        if (activeCopy >= 0 && inside(activeCopy, keep)) copyNow = activeCopy;
        else for (let k = 0; k < n; k++) if (inside(k, 0)) copyNow = k;
      }
      // A hovered service belongs to the beat it was hovered on (round 11).
      if (copyNow !== activeCopy) {
        delete html.dataset.lwHover;
        latch.key = "";
      }
      activeCopy = copyNow;
      for (let k = 0; k < n; k++) {
        copyState[k] = k === copyNow ? "in" : y > holdAt(k) ? "above" : "below";
      }
      // The beat (the nav's active link) switches halfway through each hand-over.
      let beatIdx = -1;
      if (pinned >= 0) beatIdx = pinned;
      else if (y >= at(0) + 0.5 * FIRST_POUR * len(0)) {
        beatIdx = 0;
        for (let k = 1; k < n; k++) {
          const mid = at(k) + 0.5 * (p.pourLen - 0.45 * p.meltLen) * unit;
          if (y >= mid) beatIdx = k;
        }
      } else if (f.reduced) beatIdx = 0;
      // Where each beat holds (the nav's link targets, the scroll's snap points).
      for (let k = 0; k < n; k++) {
        beatsY[SHAPES[k].key] = snapPoints[k] = holdAt(k);
        snapZones[k][0] = Math.min(formedAt(k), holdAt(k));
        snapZones[k][1] = Math.max(Math.min(leaveAt(k), maxY), holdAt(k));
      }
      snapStory =
        pinned < 0 && !f.reduced
          ? { points: snapPoints, zones: snapZones }
          : null;
      syncPage(beatIdx < 0 ? "hero" : SHAPES[beatIdx].key, copyState);

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
          : firstFrom === 2
            ? // Round 12: one even, eased drain (no rush at the end), overlapping the
              // first shape's gathering.
              (1 + POUR_V) * smoothstep(DRAIN_FROM, DRAIN_TO, exit)
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
      // Round 12: while the pool pours and the first shape gathers, the falls carry it
      // visibly (denser, and not dimmed in the centre), easing back as the shape forms.
      const handover =
        firstFrom === 2 && !f.reduced
          ? smoothstep(DRAIN_FROM + 0.08, 0.45, exit) *
            (1 - smoothstep(0.55, 1, form0))
          : 0;
      sheetParams.veil = Math.max(p.veil * (1 - 0.8 * handover), shapeVeil);
      sheetParams.veilWidth = Math.max(p.veilWidth, shapeVeilW);
      sheetParams.mist = p.mist;
      sheetParams.sway = p.sway;
      sheetParams.thinning = p.thinning;
      sheetParams.fadeIn = lerp(0.2, 0.03, dry);
      sheet.update({
        ...f,
        pour: f.pour * smoothstep(0, 0.25, drain) * (1 + 0.7 * handover),
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
      const wide = f.W >= 768;
      const scaleOf = (k: number) =>
        Math.min(
          f.H * (wide ? 0.4 : 0.3),
          (f.W * (wide ? 0.36 : 0.8)) / Math.max(0.2, targetsAt(k)!.aspect),
        ) * p.shapeSize;

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
        u.uGrabR.value = 0;
        u.uGrip.value = 0;
        u.uFlow.value = 0;
        u.uSplash.value = splash;
        u.uLandY.value =
          heroLand > landBelow ? Math.min(heroLand, f.landY) : f.landY;
        u.uWobble.value = f.reduced ? 0 : p.wobble;
        u.uGlint.value = p.glint;
        u.uCursorLight.value = f.reduced ? 0 : f.cursor * p.cursorLight;
        u.uDrips.value = f.reduced ? 0 : p.drips;
        u.uClock.value = clock;
        // The light orbits slowly, so highlights glide over the liquid.
        (u.uLight.value as THREE.Vector3)
          .set(Math.cos(a) * 0.55, 0.5 + 0.2 * Math.sin(a * 0.7), 0.75)
          .normalize();
        u.uMirrorY.value = mirrorY;
        u.uReflect.value = reflect * (1 - f.flood);
        u.uAlphaK.value = 0.5 * (1 - f.flood);
        l.points.visible = f.flood < 0.995;
        l.mirror.visible = reflect * (1 - f.flood) > 0.01;
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
        // Which hand-over the story is in (pair k -> k + 1, progress M, from above). Before
        // the first hand-over, the first shape pours in (out of the falls); after the last,
        // it holds.
        const pour = form0;
        const l = layers[0];
        hide(layers[1]);
        for (let k = 0; k < n; k++) lastRelease[k] = 0;
        if (pour <= 0) {
          hide(l);
          onScreen.k = -1;
          grab.held = false;
          setGrabCursor("");
          flow.a = flow.b = -1;
          flow.t = 0;
          latch.key = "";
          label =
            drain < 0.01
              ? ""
              : drain < 1 + POUR_V - 0.005
                ? `pool pouring ${Math.round((drain / (1 + POUR_V)) * 100)}%`
                : "falls";
        } else {
          // Which shape holds (fully formed, no hand-over running), if any.
          const holding =
            M >= 1
              ? Math.min(pair + 1, n - 1)
              : M <= 0 && pour >= 1
                ? pair
                : -1;
          // Round 11, services that react on hover: while a shape holds and the story is
          // still, the hovered service (html[data-lw-hover], one of this pillar's) flows the
          // liquid straight into its own shape, and back when the pointer leaves. The
          // layer's two target sets become that flow's from and to; each swap happens while
          // the visible shape equals one of them, so nothing ever jumps. When the story
          // moves on, the flow unwinds quickly and hands back to it.
          let want = holding;
          const listed = html.dataset.lwHover ?? "";
          if (listed) {
            latch.key = listed;
            latch.until = clock + 0.45;
          } else if (latch.key && (grab.held || grab.hover)) {
            latch.until = clock + 0.45;
          } else if (latch.key && clock > latch.until) latch.key = "";
          const hk = latch.key;
          if (holding >= 0 && hk && Math.abs(storyV) < 60 && f.flood < 0.5) {
            const service = SERVICE_OF.get(hk);
            if (
              service &&
              service.pillar === holding &&
              serviceTargets[service.j]
            ) {
              want = n + service.j;
            }
          }
          if (holding >= 0 && flow.a < 0) {
            flow.a = flow.b = flow.base = holding;
            flow.t = 0;
          }
          if (flow.a >= 0) {
            if (holding >= 0) flow.base = holding;
            else want = flow.base;
            // While the mouse holds the liquid, the shape it holds stays put.
            if (grab.held && holding >= 0) {
              const held = flow.t <= 0 ? flow.a : flow.t >= 1 ? flow.b : -1;
              if (held >= 0) want = held;
            }
            // Leaving a service unwinds gently; once the page moves it hurries back.
            const moving = holding < 0 || Math.abs(storyV) >= 60;
            const into = f.dt / 0.9;
            const back = f.dt / (holding < 0 ? 0.2 : moving ? 0.3 : 0.6);
            if (want === flow.a) flow.t = Math.max(0, flow.t - back);
            else if (want === flow.b) flow.t = Math.min(1, flow.t + into);
            else if (flow.t <= 0) {
              flow.b = want;
              flow.t = Math.min(1, into);
            } else if (flow.t >= 1) {
              flow.a = flow.b;
              flow.b = want;
              flow.t = 0;
            } else if (flow.t < 0.5) flow.t = Math.max(0, flow.t - back);
            else flow.t = Math.min(1, flow.t + into);
            // Back on the pillar with the story moving: hand back to it.
            const visible = flow.t <= 0 ? flow.a : flow.t >= 1 ? flow.b : -1;
            if (holding < 0 && visible === flow.base) {
              flow.a = flow.b = -1;
              morphCatch = 0;
            }
          }
          morphCatch = Math.min(1, morphCatch + f.dt / 0.35);
          const Mshow = M * (1 - (1 - morphCatch) ** 2);
          const flowing = flow.a >= 0;
          const showA = flowing ? flow.a : pair;
          const showB = flowing ? flow.b : Math.min(pair + 1, n - 1);
          upload(l, showA, showB);
          const scaleA = scaleOf(showA);
          const scaleB = scaleOf(showB);
          const wA = scaleA * targetsAt(showA)!.aspect;
          const wB = scaleB * targetsAt(showB)!.aspect;
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
          const pouring = !flowing && pair === 0 && M === 0;
          u.uForm.value = pouring ? pour : 1;
          setFirst(l, pouring);
          u.uRelease.value = 0;
          u.uMorphOn.value = 1;
          u.uMorph.value = flowing ? 0 : Mshow;
          u.uFlow.value = flowing ? flow.t : 0;
          u.uPuddleY.value = puddleY;
          u.uPuddleW.value = 0.5 * Math.max(wA, wB) * (intoPool ? 1.5 : 0.95);
          u.uPuddleT.value =
            (intoPool ? 0.05 : 0.09) * Math.max(scaleA, scaleB);

          // Pull the liquid (round 11): only a fully formed, still shape can be held.
          const settled = !flowing
            ? holding
            : flow.t <= 0
              ? flow.a
              : flow.t >= 1
                ? flow.b
                : -1;
          const pullOn =
            settled >= 0 && p.pull > 0 && f.flood < 0.5 && !f.reduced;
          onScreen.k = pullOn ? settled : -1;
          onScreen.cx = cx;
          onScreen.cy = cy;
          onScreen.scale = settled >= 0 ? scaleOf(settled) : scaleA;
          onScreen.off = l.off;
          if (!pullOn) grab.held = false;
          if (grab.moved && !grab.held) {
            grab.hover = pullOn && onShape(grab.px, grab.py);
            grab.moved = false;
          }
          setGrabCursor(
            grab.held ? "pull" : grab.hover && pullOn ? "hover" : "",
          );
          // The grabbed spot rides with the shape; the pull follows the pointer on a stiff
          // spring with a rubber band (the further out, the harder), and on release springs
          // back loosely enough to overshoot and wobble.
          const anchorX = cx + grab.ax;
          const anchorY = cy + l.off + grab.ay;
          let tx = 0;
          let ty = 0;
          if (grab.held) {
            const dx = grab.px - anchorX;
            const dy = grab.py - anchorY;
            const reach = Math.hypot(dx, dy);
            const max = f.H * 0.5 * p.pull;
            const k =
              reach > 0 ? (max * (1 - Math.exp(-reach / max))) / reach : 0;
            tx = dx * k;
            ty = dy * k;
          }
          const ps = grab.held
            ? springConstants(0.14, 0.9)
            : springConstants(0.6, 0.3);
          for (let i = 0; i < sub; i++) {
            grab.vx += (ps.k * (tx - grab.x) - ps.c * grab.vx) * hStep;
            grab.vy += (ps.k * (ty - grab.y) - ps.c * grab.vy) * hStep;
            grab.x += grab.vx * hStep;
            grab.y += grab.vy * hStep;
          }
          // The grip closes fast (the press should answer at once) and opens slower, as
          // the strand springs home.
          grab.grip = damp(
            grab.grip,
            grab.held ? 1 : 0,
            grab.held ? 14 : 4.5,
            f.dt,
          );
          const live =
            grab.held ||
            grab.grip > 0.01 ||
            Math.hypot(grab.x, grab.y) + Math.hypot(grab.vx, grab.vy) * 0.02 >
              0.3;
          if (!live) grab.grip = 0;
          if (!live) grab.x = grab.y = grab.vx = grab.vy = 0;
          (u.uGrab.value as THREE.Vector4).set(
            anchorX,
            anchorY,
            grab.x,
            grab.y,
          );
          u.uGrabR.value = live ? clamp(onScreen.scale * 0.22, 48, 110) : 0;
          u.uGrip.value = grab.grip;

          // The light follows the liquid down into the puddle and back up.
          const puddled = flowing
            ? 0
            : smoothstep(0.15, 0.45, Mshow) *
              (1 - smoothstep(0.55, 0.85, Mshow));
          const formed = pouring ? smoothstep(0.2, 1, pour) : 1;
          // In a hover flow the light moves over to the shape it is becoming.
          const width = flowing ? lerp(wA, wB, flow.t) : Mshow < 0.5 ? wA : wB;
          const height = flowing
            ? lerp(scaleA, scaleB, flow.t)
            : Mshow < 0.5
              ? scaleA
              : scaleB;
          glowFor(
            l,
            width + (Math.max(wA, wB) - width) * puddled,
            height * (1 - 0.8 * puddled),
            formed * (1 + 0.3 * puddled),
            cy + (puddleY - cy) * puddled,
          );
          const from = keyOf(showA);
          const to = keyOf(showB);
          const pourLabel = `${["above", "pool", "falls"][first]} -> ${from} ${Math.round(pour * 100)}%`;
          label = flowing
            ? flow.t <= 0 || flow.a === flow.b
              ? `${from} holding`
              : flow.t >= 1
                ? `${to} holding${showB >= n ? " (hover)" : ""}`
                : `${from} -> ${to} ${Math.round(flow.t * 100)}% (hover)`
            : M <= 0
              ? pour < 1
                ? pourLabel
                : `${from} holding`
              : M >= 1
                ? `${to} holding`
                : `${from} -> ${to} ${Math.round(M * 100)}%`;
        }
        return;
      }

      // No hover flows outside the morph story.
      flow.a = flow.b = -1;
      flow.t = 0;
      latch.key = "";

      // Melt mode (and reduced motion / a pinned shape): pour in over the first part of
      // each slot, melt out across the end of it (overlapping the next shape's pour); the
      // last one never melts. (form / release are computed above.)
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

    snap: () => snapStory,

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
      window.removeEventListener("pointerdown", onGrabDown);
      window.removeEventListener("pointermove", onGrabMove);
      window.removeEventListener("pointerup", onGrabUp);
      window.removeEventListener("pointercancel", onGrabUp);
      setGrabCursor("");
      delete html.dataset.lwHover;
      // The hero pool belongs to the engine: put it back to rest for the next variant.
      ctx.topPool.setSpill(null);
      // Hide the copy, drop the story the nav reads and give the page its length back.
      syncPage("", null);
      setTrack(0);
      delete html.dataset.lwBeat;
      const g = globalThis as StoryGlobal;
      if (g.__lwBeats === beatsY) delete g.__lwBeats;
      sheet.dispose();
      for (const l of layers) {
        l.geometry.dispose();
        l.material.dispose();
        l.mirrorMaterial.dispose();
      }
    },
  };
}
