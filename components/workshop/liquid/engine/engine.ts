// PROTOTYPE, never merge. Liquid Pour workshop: the engine. One WebGL context for the
// lifetime of the page; variants swap only their own particle system, never the
// renderer (Chrome evicts contexts past ~16, and dev Strict Mode double-mounts).
//
// Choreography, keyed to the real section anchors so it survives section redesigns:
//   hero    -> a calm glowing liquid surface below the title (top pool)
//   spill   -> scrolling out of the hero, the surface rises with the page and its lip spills
//   pour    -> about/services: liquid falls from the top edge into a pool at the bottom,
//              trailing you like honey (attach drag + springs); the pool level rises
//   pool    -> contact/footer: the source runs dry and the pool settles, mirroring the hero
import * as THREE from "three";

import { createPanel, type Panel } from "./panel";
import { getParams, TIERS, type TierKey, type VariantKey } from "./params";
import { PoolSystem } from "./pool";
import {
  GLOW_COUNT,
  createBackgroundMaterial,
  createFinalMaterial,
  createFullscreenTriangle,
} from "./post";
import { QualityGovernor } from "./quality";
import { RippleField } from "./ripple";
import {
  ScrollTracker,
  clamp,
  damp,
  lerp,
  smoothstep,
  springConstants,
} from "./scroll";
import type { Fonts } from "./shapes";
import { SmoothScroll } from "./smooth";
import { createCascade } from "./variants/cascade";
import { createCup } from "./variants/cup";
import { createDrip } from "./variants/drip";
import { createForm } from "./variants/form";
import { createStream } from "./variants/stream";
import type {
  FrameState,
  GlowSpec,
  Impact,
  VariantContext,
  VariantSystem,
} from "./variants/types";

export interface EngineOptions {
  host: HTMLElement;
  variant: VariantKey;
  /** Pinned quality tier (`?lwq=`), or null to auto-detect + govern. */
  tier: TierKey | null;
  hud: boolean;
  /** The site's next/font families (the form variant draws its wordmark with them). */
  fonts?: Fonts;
  onFallback: () => void;
}

export interface Engine {
  setVariant(key: VariantKey): void;
  dispose(): void;
}

export interface LiquidDebug {
  state(): Record<string, unknown>;
  /** Snap every spring to rest for the current scroll position (next frame). */
  settle(): void;
  /** Stop the clock at `t` seconds (deterministic screenshots). */
  freeze(t?: number): void;
  unfreeze(): void;
  /** Inject a synthetic scroll drag of `px` to show the honey lag while frozen. */
  kick(px?: number): void;
}

type LwGlobal = typeof globalThis & { __lwEngine?: Engine; __lw?: LiquidDebug };

const FACTORIES: Record<VariantKey, (ctx: VariantContext) => VariantSystem> = {
  form: createForm,
  cup: createCup,
  stream: createStream,
  cascade: createCascade,
  drip: createDrip,
};

/** Bottom-pool landing line, as a screen fraction between its horizon (0) and near edge (1). */
const LAND_SN = 0.32;
const BOTTOM_DEPTH = 6;
const FAR_WIDTH = 1.15;
const NEAR_WIDTH = 2.3;

export function createEngine(opts: EngineOptions): Engine {
  const g = globalThis as LwGlobal;
  g.__lwEngine?.dispose();

  const params = getParams();
  const html = document.documentElement;

  // A fresh canvas per engine: a context that was force-lost can never come back.
  const canvas = document.createElement("canvas");
  canvas.dataset.lw = "1";
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block";
  opts.host.appendChild(canvas);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
  } catch (err) {
    canvas.remove();
    throw err;
  }
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const tierKey: TierKey = opts.tier ?? (coarse ? "mobile" : "desktop");
  const budget = TIERS[tierKey];
  const quality = new QualityGovernor(opts.tier !== null);
  const floatTargets =
    renderer.extensions.has("EXT_color_buffer_float") ||
    renderer.extensions.has("EXT_color_buffer_half_float");

  const common: Record<string, THREE.IUniform> = {
    uViewport: { value: new THREE.Vector2(1, 1) },
    uPixelRatio: { value: 1 },
    uTime: { value: 0 },
    uTheme: { value: 0 },
    uVelN: { value: 0 },
    uRampD: { value: [0, 1, 2, 3].map(() => new THREE.Color()) },
    uAccentD: { value: new THREE.Color() },
    uRampL: { value: [0, 1, 2, 3].map(() => new THREE.Color()) },
    uAccentL: { value: new THREE.Color() },
    uHueDrift: { value: 0.3 },
    uJitter: { value: 0.1 },
    uSizeScale: { value: 1 },
    uGlowGain: { value: 1 },
    // xy: pointer in screen px, z: how much it is touching the liquid (fades when idle).
    uPointer: { value: new THREE.Vector3(-1e4, -1e4, 0) },
  };

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const triangle = createFullscreenTriangle();
  const background = createBackgroundMaterial(common);
  const bgScene = new THREE.Scene();
  const bgMesh = new THREE.Mesh(triangle, background.material);
  bgMesh.frustumCulled = false;
  bgScene.add(bgMesh);

  const sceneRT = new THREE.WebGLRenderTarget(1, 1, {
    type: floatTargets ? THREE.HalfFloatType : THREE.UnsignedByteType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
  const finalMaterial = createFinalMaterial(common);
  finalMaterial.uniforms.uScene.value = sceneRT.texture;
  const finalScene = new THREE.Scene();
  const finalMesh = new THREE.Mesh(triangle, finalMaterial);
  finalMesh.frustumCulled = false;
  finalScene.add(finalMesh);

  const particles = new THREE.Scene();
  const topPool = new PoolSystem(
    common,
    budget.topPool[0],
    budget.topPool[1],
    0,
  );
  const bottomPool = new PoolSystem(
    common,
    budget.bottomPool[0],
    budget.bottomPool[1],
    7.3,
  );
  particles.add(topPool.points, bottomPool.points);

  const rippleCapable = floatTargets && budget.ripple > 0;
  const topRipple = rippleCapable
    ? new RippleField(renderer, budget.ripple)
    : null;
  const bottomRipple = rippleCapable
    ? new RippleField(renderer, budget.ripple)
    : null;

  let variantKey = opts.variant;
  // The cup draws its surface on the engine's (otherwise hero-pool) ripple tank.
  const variantContext: VariantContext = {
    common,
    budget,
    ripple: topRipple,
    fonts: opts.fonts ?? {
      pixel: "monospace",
      marker: "cursive",
      sans: "sans-serif",
    },
    topPool,
  };
  let variant = FACTORIES[variantKey](variantContext);
  particles.add(variant.object);

  const scroll = new ScrollTracker();
  // Round 10: the page glides (Lenis), stepped at the top of every frame below.
  const smooth = new SmoothScroll();
  let W = 1;
  let H = 1;
  let dpr = 1;
  let dirty = true;
  let disposed = false;
  let lost = false;

  const panel: Panel | null = opts.hud
    ? createPanel({
        params,
        variant: variantKey,
        getExport: () => ({
          workshop: "liquid-pour",
          variant: variantKey,
          tier: tierKey,
          params: { common: params.common, [variantKey]: params[variantKey] },
        }),
        onStructural: () => applyQuality(),
      })
    : null;

  // ---- Theme (follows next-themes' class on <html>, crossfaded) ----------------------
  let isDark = html.classList.contains("dark");
  const themeObserver = new MutationObserver(() => {
    isDark = html.classList.contains("dark");
    dirty = true;
  });
  themeObserver.observe(html, { attributes: true, attributeFilter: ["class"] });
  const themeTarget = () => {
    const o = params.common.theme.override;
    if (o === "dark") return 0;
    if (o === "light") return 1;
    return isDark ? 0 : 1;
  };
  let theme = themeTarget();

  // ---- Reduced motion -----------------------------------------------------------------
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motionQuery.matches;
  const onMotion = () => {
    reduced = motionQuery.matches;
    dirty = true;
  };
  motionQuery.addEventListener("change", onMotion);

  // ---- Size + quality -----------------------------------------------------------------
  function resize() {
    W = Math.max(1, opts.host.clientWidth);
    H = Math.max(1, opts.host.clientHeight);
    const cap = Math.max(0.5, budget.dprCap - quality.settings.dprDelta);
    dpr = Math.min(window.devicePixelRatio || 1, cap);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    const pw = Math.max(1, Math.round(W * dpr));
    const ph = Math.max(1, Math.round(H * dpr));
    sceneRT.setSize(pw, ph);
    (finalMaterial.uniforms.uResolution.value as THREE.Vector2).set(pw, ph);
    (common.uViewport.value as THREE.Vector2).set(W, H);
    common.uPixelRatio.value = dpr;
    scroll.measure();
    dirty = true;
  }

  function applyQuality() {
    const q = quality.settings;
    topPool.setDrawFraction(q.frac);
    bottomPool.setDrawFraction(q.frac);
    variant.setDrawFraction(q.frac);
    const ripplesOn = q.ripples && params.common.pools.ripples;
    if (topRipple) topRipple.enabled = ripplesOn;
    if (bottomRipple) bottomRipple.enabled = ripplesOn;
    resize();
  }

  const hostObserver = new ResizeObserver(() => resize());
  hostObserver.observe(opts.host);
  const mainEl = document.querySelector("main");
  const layoutObserver = new ResizeObserver(() => scroll.measure());
  if (mainEl) layoutObserver.observe(mainEl);
  void document.fonts?.ready.then(() => {
    if (!disposed) scroll.measure();
  });
  applyQuality();

  // ---- Lifecycle events ---------------------------------------------------------------
  let paused = document.hidden;
  let last = performance.now();
  const onVisibility = () => {
    paused = document.hidden;
    if (!paused) {
      last = performance.now();
      quality.warmUp();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  // The pointer touches the liquid (the canvas itself is pointer-events: none).
  const pointer = {
    x: -1e4,
    y: -1e4,
    px: -1e4,
    py: -1e4,
    moved: 0,
    touch: 0,
    // Round 11 (the cursor light): what kind of pointer, whether it has left the window,
    // and how present it is (eased).
    kind: "",
    left: true,
    present: 0,
  };
  const onPointer = (event: PointerEvent) => {
    const r = opts.host.getBoundingClientRect();
    pointer.x = event.clientX - r.left;
    pointer.y = event.clientY - r.top;
    pointer.moved = performance.now();
    pointer.kind = event.pointerType;
    pointer.left = false;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  // Leaving the window: an out event with nowhere to go.
  const onPointerOut = (event: PointerEvent) => {
    if (!event.relatedTarget) pointer.left = true;
  };
  document.addEventListener("pointerout", onPointerOut, { passive: true });

  const onContextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    opts.onFallback();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  // ---- Palette sync (only re-parses colours when a hex actually changed) --------------
  let paletteKey = "";
  const rampD = common.uRampD.value as THREE.Color[];
  const rampL = common.uRampL.value as THREE.Color[];
  function syncPalette() {
    const d = params.common.palette.dark;
    const l = params.common.palette.light;
    const key = [
      d.base,
      d.c0,
      d.c1,
      d.c2,
      d.c3,
      d.accent,
      l.base,
      l.c0,
      l.c1,
      l.c2,
      l.c3,
      l.accent,
    ].join();
    if (key === paletteKey) return;
    paletteKey = key;
    [d.c0, d.c1, d.c2, d.c3].forEach((hex, i) => rampD[i].set(hex));
    [l.c0, l.c1, l.c2, l.c3].forEach((hex, i) => rampL[i].set(hex));
    (common.uAccentD.value as THREE.Color).set(d.accent);
    (common.uAccentL.value as THREE.Color).set(l.accent);
    (background.material.uniforms.uBaseD.value as THREE.Color).set(d.base);
    (finalMaterial.uniforms.uBase.value as THREE.Color).set(d.base);
    (background.material.uniforms.uBaseL.value as THREE.Color).set(l.base);
    const lum = (c: THREE.Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    baseLumD = lum(background.material.uniforms.uBaseD.value as THREE.Color);
    baseLumL = lum(background.material.uniforms.uBaseL.value as THREE.Color);
    // The light fields' faint tails: deep crimson leaning magenta (see BACKGROUND_FRAG).
    (background.material.uniforms.uEdgeCol.value as THREE.Color)
      .copy(rampD[0])
      .lerp(common.uAccentD.value as THREE.Color, 0.25)
      .multiplyScalar(0.7);
    dirty = true;
  }

  const glowTmp = new THREE.Color();
  function setGlow(
    i: number,
    x: number,
    y: number,
    rx: number,
    ry: number,
    color: THREE.Color,
    a: number,
  ) {
    background.glowPos[i].set(x, y, rx, ry);
    background.glowCol[i].set(color.r, color.g, color.b, Math.max(0, a));
  }

  // ---- Debug API (screenshots, verification) -----------------------------------------
  let frozenAt: number | null = null;
  let settleFrames = 0;
  let kick = 0;
  let impactGlow = 0;
  let time = 0;
  let raf = 0;
  let lastRender = 0;
  let readyKey = "";
  let lastSee = "";
  let lastContent = "";
  const glowList: GlowSpec[] = [];
  let lastBlend = "";
  // The page's text (workshop nav + pillar copy) reads in dark ink on a bright base (the
  // vivid orange, the porcelain light theme) and in light ink on a dark one (ember):
  // whichever contrasts more with the base's relative luminance.
  let baseLumD = 0;
  let baseLumL = 1;
  let lastInk = "";
  // The workshop nav's phone menu floods the screen: the lake rises (html[data-lw-flood]).
  let flood = 0;
  let floodV = 0;
  let lastFloodTarget = 0;
  let topDropClock = 0;
  const impacts: Impact[] = [];
  const beats = { heroExit: 0, spill: 0, pour: 0, poolT: 0, calm: 0 };

  const drawnTotal = () =>
    topPool.drawn() + bottomPool.drawn() + variant.drawn();

  const debug: LiquidDebug = {
    state: () => ({
      variant: variantKey,
      tier: tierKey,
      qualityStep: quality.level,
      dpr,
      viewport: [W, H],
      particles: drawnTotal(),
      scrollY: scroll.y,
      beats: { ...beats },
      theme,
      reduced,
      floatTargets,
      ripples: Boolean(topRipple?.enabled),
      frozen: frozenAt,
      time,
      ...variant.debug?.(),
    }),
    settle: () => {
      settleFrames = 2;
    },
    freeze: (t = 12) => {
      frozenAt = t;
    },
    unfreeze: () => {
      frozenAt = null;
      last = performance.now();
    },
    kick: (px = 420) => {
      kick += px;
    },
  };
  g.__lw = debug;

  // ---- The frame ----------------------------------------------------------------------
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    // The glide runs even while the liquid can't draw (a lost context), or the page would
    // stop scrolling: Lenis has already swallowed the wheel events.
    if (!disposed) {
      smooth.frame(
        now,
        params.common.scroll,
        html.dataset.lwFlood === "1",
        reduced,
        variant.snap?.() ?? null,
      );
    }
    if (paused || lost || disposed) return;
    const frameMs = now - last;
    const rawDt = Math.min(0.05, Math.max(0, frameMs / 1000));
    last = now;
    panel?.fpsBegin();

    const animate = frozenAt === null && !reduced;
    const dt = animate ? rawDt : 0;
    time = frozenAt ?? (time + dt) % 3600;
    scroll.update(rawDt, H);
    const s = scroll.sections;
    const P = params.common;

    const target = themeTarget();
    theme = reduced ? target : damp(theme, target, 9, rawDt);
    if (Math.abs(theme - target) < 0.002) theme = target;
    const ink = lerp(baseLumD, baseLumL, theme) > 0.18 ? "dark" : "light";
    if (ink !== lastInk) {
      html.dataset.lwInk = ink;
      lastInk = ink;
    }

    // Menu flood: a short spring with a little slosh at the top (it is liquid), snapped
    // under reduced motion.
    const floodTarget = html.dataset.lwFlood === "1" ? 1 : 0;
    if (floodTarget !== lastFloodTarget) {
      lastFloodTarget = floodTarget;
      dirty = true;
    }
    if (reduced) {
      flood = floodTarget;
      floodV = 0;
    } else {
      const fs = springConstants(0.6, 0.82);
      floodV += (fs.k * (floodTarget - flood) - fs.c * floodV) * rawDt;
      flood = clamp(flood + floodV * rawDt, -0.05, 1.15);
    }
    const flooded = clamp(flood, 0, 1);

    // Beats.
    const heroH = Math.max(1, s.heroBottom - s.heroTop);
    let heroExit = clamp(scroll.y / heroH, 0, 1);
    let spill = smoothstep(0.02, 0.3, heroExit);
    const calmEnd = s.ctaTop - H * 0.35;
    let calm = smoothstep(s.ctaTop - H, calmEnd, scroll.y);
    // Round 11 ("footer water level can be a little lower while we are moving down, it's a
    // bit too much at the end of the page"): the lake rises late (a power curve, so it stays
    // low through the story) and tops out lower (poolMax 0.3 -> 0.2).
    let poolT =
      smoothstep(heroH * 0.3, Math.max(heroH * 0.3 + 1, calmEnd), scroll.y) **
      1.3;
    if (reduced) {
      heroExit = 1;
      spill = 1;
      calm = 0;
      poolT = 0.6;
    }
    const pour = spill * (1 - calm) * (1 - flooded);
    Object.assign(beats, { heroExit, spill, pour, poolT, calm });

    // Pools in screen px. The top pool is attached to the hero (scrolls with the page).
    const topHorizonY = s.heroTop + heroH * P.pools.heroHorizon - scroll.y;
    const topNearY = s.heroBottom + heroH * 0.06 - scroll.y;
    const topAlpha =
      (reduced ? 0 : smoothstep(-heroH * 0.2, heroH * 0.05, topNearY)) *
      (1 - smoothstep(0, 0.6, flood));
    // The lake rises past the top of the screen when the menu floods it.
    const level = lerp(poolT * P.pools.poolMax * H, H * 1.2, flood);
    const bottomHorizonY = H - level;
    const bottomNearY = H * 1.08;
    const bottomAlpha = smoothstep(2, 24, level);
    const sourceY = Math.max(topNearY - 6, -40);
    const landY = Math.min(
      H + 12,
      bottomHorizonY + (bottomNearY - bottomHorizonY) * LAND_SN,
    );

    const progress = reduced
      ? 0.5
      : clamp(scroll.y / Math.max(1, s.docH - H), 0, 1);
    const owns = Boolean(variant.ownsScene);
    const dragDy = reduced ? 0 : scroll.dy + kick;
    kick = 0;
    const f: FrameState = {
      t: time,
      dt,
      W,
      H,
      scrollY: scroll.y,
      progress,
      dy: dragDy,
      velN: reduced ? 0 : scroll.velN,
      accN: reduced ? 0 : scroll.accN,
      reduced,
      heroExit,
      pour,
      poolT,
      sourceY,
      landY,
      sections: s,
      params,
      settle: settleFrames > 0,
      flood: flooded,
      cursor: pointer.present,
    };
    variant.update(f);
    if (settleFrames > 0) settleFrames--;

    // Ripples: the pour's impacts hit the bottom pool; the hero pool gets gentle rain.
    impacts.length = 0;
    variant.drainImpacts(impacts);
    let impactEnergy = 0;
    if (!owns && bottomRipple?.enabled && dt > 0) {
      const lateral = FAR_WIDTH + (NEAR_WIDTH - FAR_WIDTH) * LAND_SN;
      const sLand = LAND_SN * (1 - 1 / BOTTOM_DEPTH) + 1 / BOTTOM_DEPTH;
      const vLand = (1 / sLand - 1) / (BOTTOM_DEPTH - 1);
      for (const im of impacts) {
        const u = (im.x - W / 2) / ((W / 2) * lateral);
        bottomRipple.addDrop(
          u * 0.5 + 0.5,
          vLand,
          im.radius,
          im.strength * P.pools.rippleAmp,
        );
        impactEnergy += im.strength;
      }
      bottomRipple.step(dt);
    }
    // Pointer: pushes the form variant's shapes aside, and ripples whichever pool is under
    // it, scaled by how fast it moves.
    // A mouse about the page (not a finger): the shapes' cursor light. It lingers a few
    // seconds after the last move, then hands back to the orbiting light.
    const hovering =
      !reduced &&
      (pointer.kind === "mouse" || pointer.kind === "pen") &&
      !pointer.left &&
      now - pointer.moved < 4000
        ? 1
        : 0;
    pointer.present = damp(
      pointer.present,
      hovering,
      hovering ? 5 : 1.2,
      rawDt,
    );
    const touching = now - pointer.moved < 140 ? 1 : 0;
    // Round 12: the parting opens a little softer (was 12), closer to the grip's feel.
    pointer.touch = damp(pointer.touch, touching, touching ? 8 : 1.6, rawDt);
    (common.uPointer.value as THREE.Vector3).set(
      pointer.x,
      pointer.y,
      reduced ? 0 : pointer.touch * P.interaction.pointer,
    );
    const pointerSpeed = Math.hypot(
      pointer.x - pointer.px,
      pointer.y - pointer.py,
    );
    pointer.px = pointer.x;
    pointer.py = pointer.y;
    if (dt > 0 && touching && pointerSpeed > 2 && P.interaction.pointer > 0) {
      const strength =
        Math.min(0.5, pointerSpeed / 120) * P.interaction.pointer;
      const drop = (
        field: RippleField | null,
        horizonY: number,
        nearY: number,
        depth: number,
      ) => {
        if (!field?.enabled || pointer.y < horizonY || pointer.y > nearY)
          return;
        const sn = (pointer.y - horizonY) / Math.max(1, nearY - horizonY);
        const sDepth = sn * (1 - 1 / depth) + 1 / depth;
        const v = (1 / sDepth - 1) / (depth - 1);
        const lateral = FAR_WIDTH + (NEAR_WIDTH - FAR_WIDTH) * sn;
        const u = (pointer.x - W / 2) / ((W / 2) * lateral);
        field.addDrop(u * 0.5 + 0.5, v, 0.018, strength);
      };
      if (!owns) {
        if (topAlpha > 0.05)
          drop(topRipple, topHorizonY, topNearY, P.pools.heroDepth);
        if (bottomAlpha > 0.05)
          drop(bottomRipple, bottomHorizonY, bottomNearY, BOTTOM_DEPTH);
      }
    }

    if (topRipple?.enabled && dt > 0) {
      topDropClock -= dt;
      if (topDropClock <= 0) {
        topDropClock = 0.45 + Math.random() * 0.9;
        topRipple.addDrop(
          0.2 + Math.random() * 0.6,
          0.1 + Math.random() * 0.55,
          0.016 + Math.random() * 0.02,
          0.22 + Math.random() * 0.3,
        );
      }
      topRipple.step(dt);
    }

    if (owns) {
      // The variant (cup) draws its own surfaces.
      topPool.points.visible = false;
      bottomPool.points.visible = false;
    } else {
      topPool.set({
        horizonY: topHorizonY,
        nearY: topNearY,
        alpha: topAlpha,
        amp: P.pools.heroSwell,
        depth: P.pools.heroDepth,
        farWidth: FAR_WIDTH,
        nearWidth: NEAR_WIDTH,
        swellSpeed: P.pools.swellSpeed,
        chop: P.pools.chop,
        size: 3.4,
        colorBias: 0,
        ripple: topRipple?.enabled ? topRipple.texture : null,
        rippleAmp: P.pools.rippleAmp,
      });
      bottomPool.set({
        horizonY: bottomHorizonY,
        nearY: bottomNearY,
        alpha: bottomAlpha,
        amp: P.pools.poolSwell * (1 - 0.4 * calm),
        depth: BOTTOM_DEPTH,
        farWidth: FAR_WIDTH,
        nearWidth: NEAR_WIDTH,
        swellSpeed: P.pools.swellSpeed,
        chop: P.pools.chop,
        size: 3.2,
        colorBias: 0.05,
        ripple: bottomRipple?.enabled ? bottomRipple.texture : null,
        rippleAmp: P.pools.rippleAmp,
      });
    }

    // Shared uniforms.
    common.uTime.value = time;
    common.uTheme.value = theme;
    common.uVelN.value = f.velN;
    common.uSizeScale.value = P.particles.size;
    common.uGlowGain.value = P.particles.glow;
    common.uHueDrift.value = P.palette.hueDrift;
    common.uJitter.value = (P.palette.jitterDeg * Math.PI) / 180;
    syncPalette();

    // Light fields: the glow rides with the liquid, so the light follows you down.
    const focus = variant.focus();
    impactGlow = damp(
      impactGlow,
      Math.min(1.2, impactEnergy * 3),
      impactEnergy > 0 ? 30 : 4,
      rawDt,
    );
    if (owns && variant.glows) {
      glowList.length = 0;
      variant.glows(glowList);
      for (let i = 0; i < GLOW_COUNT; i++) {
        const gl = glowList[i];
        if (gl) setGlow(i, gl.x, gl.y, gl.rx, gl.ry, gl.color, gl.intensity);
        else background.glowCol[i].w = 0;
      }
    } else {
      // Cores are orange -> amber; the magenta lives only in the tails (uEdgeCol).
      glowTmp.copy(rampD[1]).lerp(rampD[2], 0.35);
      // The hero pool's light rides the back edge of its liquid, and dims as it drains
      // (form pours it into the falls and the first shape).
      const drain = variant.poolDrain?.() ?? 0;
      setGlow(
        0,
        W / 2,
        topHorizonY + (topNearY - topHorizonY) * clamp(drain, 0, 1) + 8,
        W * 0.55,
        H * 0.13,
        glowTmp,
        1.0 * topAlpha * (1 - smoothstep(0.5, 1.1, drain)),
      );
      const span = Math.max(1, focus.yBottom - focus.yTop);
      setGlow(
        1,
        focus.x,
        focus.yTop + span * 0.55,
        Math.max(W * 0.1, focus.width * 2.2),
        Math.max(H * 0.18, span * 0.45),
        rampD[1],
        0.4 * focus.intensity,
      );
      glowTmp.copy(rampD[1]).lerp(rampD[2], 0.2);
      setGlow(
        2,
        W / 2,
        bottomHorizonY + level * 0.2,
        W * 0.6,
        Math.max(level, 30) + H * 0.1,
        glowTmp,
        (0.9 + 0.5 * flooded) * bottomAlpha,
      );
      setGlow(3, focus.x, landY, W * 0.1, H * 0.06, rampD[2], impactGlow * 0.6);
      glowList.length = 0;
      variant.extraGlows?.(glowList);
      for (let i = 4; i < GLOW_COUNT; i++) {
        const gl = glowList[i - 4];
        if (gl) setGlow(i, gl.x, gl.y, gl.rx, gl.ry, gl.color, gl.intensity);
        else background.glowCol[i].w = 0;
      }
    }
    background.material.uniforms.uGlowGain.value = P.atmosphere.glow;
    background.material.uniforms.uDots.value = P.atmosphere.dots;
    background.material.uniforms.uDotSpacing.value = Math.max(
      2,
      P.atmosphere.dotSpacing,
    );

    const fu = finalMaterial.uniforms;
    fu.uExposure.value = P.atmosphere.exposure;
    fu.uWhite.value = P.atmosphere.whitePoint;
    fu.uGrain.value = P.atmosphere.grain;
    fu.uVignette.value = P.atmosphere.vignette;
    fu.uChroma.value = reduced ? 0 : P.atmosphere.chroma;

    // Workshop stage (site content hidden or shown), section see-through and the lamp's
    // blend follow the panel and the theme.
    const content = P.sections.showContent ? "on" : "off";
    if (content !== lastContent) {
      html.dataset.lwContent = content;
      lastContent = content;
    }
    const see = P.sections.seeThrough ? "on" : "off";
    if (see !== lastSee) {
      html.dataset.lwSee = see;
      lastSee = see;
    }
    const blend =
      theme < 0.5 ? P.sections.aboutBlendDark : P.sections.aboutBlendLight;
    if (blend !== lastBlend) {
      html.style.setProperty("--lw-about-blend", blend);
      lastBlend = blend;
    }

    // Under reduced motion the scene is static: repaint ~4x/s to pick up panel edits.
    if (!reduced || dirty || now - lastRender > 250) {
      renderer.setRenderTarget(sceneRT);
      renderer.clear(true, false, false);
      renderer.render(bgScene, camera);
      renderer.render(particles, camera);
      renderer.setRenderTarget(null);
      renderer.render(finalScene, camera);
      lastRender = now;
      dirty = false;
      if (readyKey !== variantKey) {
        readyKey = variantKey;
        html.dataset.lwReady = variantKey;
      }
    }

    if (quality.update(frameMs, rawDt)) applyQuality();
    panel?.fpsEnd();
    if (panel) {
      const st = panel.stats;
      st.variant = variantKey;
      st.tier = tierKey;
      st.level = quality.level;
      st.dpr = dpr;
      st.particles = drawnTotal();
      st.scroll = scroll.y;
      st.velocity = scroll.velN;
      st.story = variant.debug?.().story ?? "";
    }
  }

  function setVariant(key: VariantKey) {
    if (disposed || key === variantKey) return;
    particles.remove(variant.object);
    variant.dispose();
    variantKey = key;
    variant = FACTORIES[key](variantContext);
    variant.setDrawFraction(quality.settings.frac);
    particles.add(variant.object);
    delete html.dataset.lwReady;
    readyKey = "";
    bottomRipple?.clear();
    quality.warmUp();
    panel?.setVariant(key);
    dirty = true;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    smooth.dispose();
    hostObserver.disconnect();
    layoutObserver.disconnect();
    themeObserver.disconnect();
    motionQuery.removeEventListener("change", onMotion);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("pointerout", onPointerOut);
    // Detach our loss handler first so tearing down doesn't flip the page to the fallback.
    canvas.removeEventListener("webglcontextlost", onContextLost);
    panel?.dispose();
    variant.dispose();
    topPool.dispose();
    bottomPool.dispose();
    topRipple?.dispose();
    bottomRipple?.dispose();
    background.material.dispose();
    finalMaterial.dispose();
    triangle.dispose();
    sceneRT.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    delete html.dataset.lwReady;
    delete html.dataset.lwSee;
    delete html.dataset.lwContent;
    delete html.dataset.lwInk;
    html.style.removeProperty("--lw-about-blend");
    if (g.__lw === debug) delete g.__lw;
    if (g.__lwEngine === engine) delete g.__lwEngine;
  }

  const engine: Engine = { setVariant, dispose };
  g.__lwEngine = engine;
  raf = requestAnimationFrame(frame);
  return engine;
}
