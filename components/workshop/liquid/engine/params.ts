// PROTOTYPE, never merge. Liquid Pour workshop (throwaway branch): every tunable value
// the panel exposes, plus the per-device particle budgets.
//
// The live params object lives on `globalThis.__lwParams` so Fast Refresh (editing any
// other engine file) keeps whatever was tuned in the panel. "Reset" in the panel
// re-applies these defaults.

export type VariantKey = "form" | "cascade" | "cup" | "stream" | "drip";
export type TierKey = "desktop" | "mobile" | "low";

export const VARIANT_KEYS: readonly VariantKey[] = [
  "form",
  "cascade",
  "cup",
  "stream",
  "drip",
];
export const TIER_KEYS: readonly TierKey[] = ["desktop", "mobile", "low"];

export interface PaletteParams {
  base: string;
  c0: string;
  c1: string;
  c2: string;
  c3: string;
  accent: string;
}

export interface CommonParams {
  theme: { override: "auto" | "dark" | "light" };
  palette: {
    /** The look that last filled `dark` (panel picker); "custom" once a colour is edited. */
    look: string;
    dark: PaletteParams;
    light: PaletteParams;
    hueDrift: number;
    jitterDeg: number;
  };
  particles: { size: number; glow: number };
  liquid: {
    // Spring "response" in seconds (Apple-style: how fast it reaches rest) and damping
    // ratio (1 = critically damped, <1 overshoots = sloshes).
    response: number;
    damping: number;
    // How much of each scroll delta drags the liquid along with the page before the
    // springs pull it back. This is the honey lag.
    attach: number;
    slosh: number;
    flow: number;
    turbulence: number;
  };
  pools: {
    heroHorizon: number;
    heroDepth: number;
    heroSwell: number;
    poolMax: number;
    poolSwell: number;
    swellSpeed: number;
    chop: number;
    ripples: boolean;
    rippleAmp: number;
  };
  atmosphere: {
    glow: number;
    grain: number;
    vignette: number;
    chroma: number;
    exposure: number;
    whitePoint: number;
    /** LED dot matrix: the light reads through a fine grid of dots (the reference's texture). */
    dots: number;
    /** Dot pitch in CSS px. */
    dotSpacing: number;
  };
  /** Touching the liquid with the pointer: pushes shapes aside, ripples the pools. */
  interaction: { pointer: number };
  /**
   * Round 10 ("scroll movements can be a bit slicker, it feels a bit instant"): the page
   * itself glides. Lenis smooths wheel and trackpad input (phones keep native momentum).
   */
  scroll: {
    /** Smooth the wheel (off = the browser's own stepped scrolling). */
    smooth: boolean;
    /** Lenis lerp: how much of the remaining distance each frame covers (lower = longer glide). */
    glide: number;
    /** Wheel distance multiplier. */
    wheel: number;
    /**
     * Round 11 ("move towards the snap"): when the scroll stops between pillars, the page
     * glides onto one (inside a pillar's hold it stays free). Phones: CSS proximity snap.
     */
    snap: boolean;
    /** Round 11: one flick carries the page at most to the next pillar, never past it. */
    catch: boolean;
    /** Quiet time (ms) after the last wheel input before the page settles. */
    settleDelay: number;
  };
  sections: {
    /** Workshop stage: false hides the site's header, sections and footer (keeps scroll length). */
    showContent: boolean;
    seeThrough: boolean;
    aboutBlendDark: string;
    aboutBlendLight: string;
  };
}

export interface StreamParams {
  width: number;
  xHero: number;
  xAbout: number;
  xServices: number;
  xCta: number;
  meander: number;
  /** 0 = vertical column that slides between sections, 1 = full diagonal riverbed. */
  bend: number;
  splash: number;
}

export interface CascadeParams {
  veil: number;
  veilWidth: number;
  mist: number;
  sway: number;
  thinning: number;
  /** Share of the fall over which the sheet fades in (form sets it; the panel doesn't). */
  fadeIn?: number;
}

/** Round 3: the cascade pours itself into silhouettes, section by section. */
export interface FormParams extends CascadeParams {
  /** "auto" scrubs through the shapes with the scroll; a shape key pins one (for tuning). */
  shape: string;
  shapeSize: number;
  /** Vertical centre of the shape, as a fraction of the viewport. */
  shapeY: number;
  /** Share of each shape's scroll slot spent pouring in / melting out (the rest it holds). */
  pourLen: number;
  meltLen: number;
  /** Scrub smoothing: seconds the story takes to catch up with the scroll (0 = locked). */
  scrub: number;
  /**
   * Round 10 ("more breathing room between the scroll movements and transitions"): screens
   * of scroll per beat. The workshop stage lengthens the page to fit (site content off).
   */
  beatLen: number;
  /** A hard fling bursts the shape into droplets that gather again as the scroll slows. */
  splash: number;
  /**
   * How one shape hands over to the next: "morph" (the same liquid slumps into a puddle
   * and rises into the next shape) or "melt" (drains into the pool, the next pours in).
   */
  handover: string;
  /** Where a morph's liquid gathers: "base" (a puddle under the shape) or "pool". */
  puddle: string;
  /** Reflections of the shapes in the bottom pool (0 = off). */
  reflect: number;
  /**
   * Where the first shape comes from: "falls" (falling droplets turn into it, round 7),
   * "pool" (the rest of the hero pool pours into it, round 6), "above" (round 4).
   */
  firstFrom: string;
  /** Share of each droplet's trip spent just falling before it turns into the shape (falls). */
  fallFirst: number;
  /** How much longer the first shape's turn is than the others' (the pool -> code stretch). */
  firstSlot: number;
  /** Share of the hero pool that spills slowly into the falls before the rest goes at once. */
  poolToFalls: number;
  /** Surface-tension wobble while a shape holds (px). */
  wobble: number;
  glint: number;
  /** Drips off the bottom edges + the trickle feeding the shape. */
  drips: number;
  /** How far a shape is dragged by the scroll before its spring catches it. */
  follow: number;
  /** How much a formed shape dims the cascade behind it. */
  sheetVeil: number;
  shapeGlow: number;
  /** Round 11: the highlights follow the mouse (0 = the light only orbits). */
  cursorLight: number;
}

export interface CupParams {
  /** Fill (fraction of the viewport height) at the top and the bottom of the page. */
  fillStart: number;
  fillEnd: number;
  /** Height of the visible top surface (perspective plane), as a fraction of the viewport. */
  surfaceDepth: number;
  /** How hard a scroll heaves the liquid (multiplies the shared "drag w/ page"). */
  heave: number;
  wallSplash: number;
  meniscus: number;
  bubbles: number;
  bodyGlow: number;
}

export interface DripParams {
  count: number;
  detach: number;
  gravity: number;
  bulb: number;
  film: number;
  growth: number;
}

export interface AllParams {
  common: CommonParams;
  form: FormParams;
  cup: CupParams;
  stream: StreamParams;
  cascade: CascadeParams;
  drip: DripParams;
}

/**
 * Looks for the additive ("dark") palette. vivid follows the user's reference (round 4): a
 * saturated orange field, cream light rising through an LED dot matrix. ember is rounds
 * 1-3: near-black with glowing red -> gold particles.
 */
export const LOOKS: Record<
  string,
  {
    palette: PaletteParams;
    atmosphere: Pick<
      CommonParams["atmosphere"],
      "glow" | "grain" | "vignette" | "dots"
    >;
    /** Particle brightness: on the bright orange field the liquid has to read as light. */
    particleGlow: number;
  }
> = {
  vivid: {
    palette: {
      base: "#EC6A34",
      c0: "#FF934F",
      c1: "#FFB872",
      c2: "#FFDC97",
      c3: "#FFF5DC",
      accent: "#FF5C8A",
    },
    atmosphere: { glow: 1.1, grain: 0.035, vignette: 0.12, dots: 0.6 },
    particleGlow: 1.9,
  },
  ember: {
    palette: {
      base: "#0C0A09",
      c0: "#F5321E",
      c1: "#EA580C",
      c2: "#FFB224",
      c3: "#FFD9A0",
      accent: "#FF3DCB",
    },
    atmosphere: { glow: 1, grain: 0.05, vignette: 0.45, dots: 0 },
    particleGlow: 1,
  },
};

export function defaultParams(): AllParams {
  return {
    common: {
      theme: { override: "auto" },
      palette: {
        // Additive palette: the vivid look by default (see LOOKS; "ember" is the old one).
        look: "vivid",
        dark: { ...LOOKS.vivid.palette },
        // Light: orange ink suspended in a cool porcelain liquid (deliberately not the
        // warm-cream default). Ramp runs light ink -> deep ink, so dense = darker.
        light: {
          base: "#EEF0F3",
          c0: "#FFB27A",
          c1: "#F7701E",
          c2: "#E2470B",
          c3: "#A3122A",
          accent: "#E8462A",
        },
        hueDrift: 0.3,
        jitterDeg: 6,
      },
      particles: { size: 1, glow: LOOKS.vivid.particleGlow },
      liquid: {
        response: 0.6,
        damping: 0.78,
        attach: 0.55,
        slosh: 0.6,
        flow: 0.22,
        turbulence: 0.35,
      },
      pools: {
        heroHorizon: 0.76,
        heroDepth: 7,
        heroSwell: 22,
        // Round 11: lower (was 0.3): "a bit too much at the end of the page".
        poolMax: 0.2,
        poolSwell: 16,
        swellSpeed: 1,
        chop: 0.6,
        ripples: true,
        rippleAmp: 1,
      },
      atmosphere: {
        ...LOOKS.vivid.atmosphere,
        chroma: 0.6,
        exposure: 1,
        whitePoint: 4,
        dotSpacing: 5,
      },
      interaction: { pointer: 1 },
      scroll: {
        smooth: true,
        glide: 0.08,
        wheel: 1,
        snap: true,
        catch: true,
        settleDelay: 160,
      },
      sections: {
        showContent: false,
        seeThrough: true,
        aboutBlendDark: "screen",
        aboutBlendLight: "multiply",
      },
    },
    form: {
      veil: 0.55,
      veilWidth: 0.42,
      mist: 0.7,
      sway: 0.6,
      thinning: 0.35,
      shape: "auto",
      shapeSize: 1,
      // Lower than round 4 (0.42): the pool pours down into the first shape (user, round 6).
      shapeY: 0.5,
      // Round 10: shorter hand-overs inside longer beats, so each shape holds a while.
      pourLen: 0.28,
      meltLen: 0.28,
      // Round 10: a heavier story (was 0.35): the liquid trails the scroll, then settles.
      scrub: 0.55,
      beatLen: 1.4,
      splash: 1,
      handover: "morph",
      puddle: "base",
      reflect: 1,
      firstFrom: "falls",
      fallFirst: 0.45,
      // Round 10: 1.45 of the longer beats (was 1.6 of the short ones).
      firstSlot: 1.45,
      poolToFalls: 0.45,
      wobble: 2.5,
      glint: 1,
      drips: 1,
      follow: 1,
      sheetVeil: 0.75,
      shapeGlow: 1,
      cursorLight: 1,
    },
    cup: {
      fillStart: 0.42,
      fillEnd: 0.62,
      surfaceDepth: 0.14,
      heave: 1,
      wallSplash: 1,
      meniscus: 1,
      bubbles: 0.6,
      bodyGlow: 1,
    },
    stream: {
      width: 72,
      xHero: 0.8,
      xAbout: 0.84,
      xServices: 0.12,
      xCta: 0.5,
      meander: 36,
      bend: 0.3,
      splash: 1,
    },
    cascade: {
      veil: 0.55,
      veilWidth: 0.42,
      mist: 0.7,
      sway: 0.6,
      thinning: 0.35,
    },
    drip: { count: 7, detach: 1, gravity: 1, bulb: 1, film: 1, growth: 1 },
  };
}

type LwGlobal = typeof globalThis & { __lwParams?: AllParams };

/** Adds any key the defaults have and `dst` lacks (a params object kept across HMR). */
function fillMissing(
  dst: Record<string, unknown>,
  src: Record<string, unknown>,
) {
  for (const [key, value] of Object.entries(src)) {
    const current = dst[key];
    if (!(key in dst)) dst[key] = value;
    else if (
      current &&
      typeof current === "object" &&
      value &&
      typeof value === "object"
    ) {
      fillMissing(
        current as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    }
  }
}

export function getParams(): AllParams {
  const g = globalThis as LwGlobal;
  if (!g.__lwParams) g.__lwParams = defaultParams();
  else
    fillMissing(
      g.__lwParams as unknown as Record<string, unknown>,
      defaultParams() as unknown as Record<string, unknown>,
    );
  return g.__lwParams;
}

/** Copies `src` into `dst` key by key (in place), so panel bindings stay attached. */
export function assignDeep(dst: object, src: unknown): void {
  if (!src || typeof src !== "object") return;
  const d = dst as Record<string, unknown>;
  for (const [key, value] of Object.entries(src as Record<string, unknown>)) {
    if (!(key in d)) continue;
    const current = d[key];
    if (
      current &&
      typeof current === "object" &&
      value &&
      typeof value === "object"
    ) {
      assignDeep(current, value);
    } else if (typeof current === typeof value) {
      d[key] = value;
    }
  }
}

export interface TierBudget {
  dprCap: number;
  topPool: readonly [number, number];
  bottomPool: readonly [number, number];
  stream: number;
  cascade: number;
  drip: number;
  cup: number;
  /** Particles per silhouette layer (the form variant runs two). */
  shape: number;
  ripple: number;
}

export const TIERS: Record<TierKey, TierBudget> = {
  desktop: {
    dprCap: 1.5,
    topPool: [220, 100],
    bottomPool: [180, 90],
    stream: 24000,
    cascade: 30000,
    drip: 18000,
    cup: 26000,
    shape: 14000,
    ripple: 256,
  },
  mobile: {
    dprCap: 1,
    topPool: [110, 56],
    bottomPool: [90, 48],
    stream: 6000,
    cascade: 8000,
    drip: 5000,
    cup: 7000,
    shape: 4500,
    ripple: 128,
  },
  low: {
    dprCap: 0.75,
    topPool: [80, 40],
    bottomPool: [64, 34],
    stream: 3000,
    cascade: 4000,
    drip: 2500,
    cup: 3500,
    shape: 2200,
    ripple: 0,
  },
};
