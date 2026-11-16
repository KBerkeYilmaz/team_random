// PROTOTYPE, never merge. Liquid Pour workshop (throwaway branch): every tunable value
// the panel exposes, plus the per-device particle budgets.
//
// The live params object lives on `globalThis.__lwParams` so Fast Refresh (editing any
// other engine file) keeps whatever was tuned in the panel. "Reset" in the panel
// re-applies these defaults.

export type VariantKey = "cup" | "stream" | "cascade" | "drip";
export type TierKey = "desktop" | "mobile" | "low";

export const VARIANT_KEYS: readonly VariantKey[] = [
  "cup",
  "stream",
  "cascade",
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
  cup: CupParams;
  stream: StreamParams;
  cascade: CascadeParams;
  drip: DripParams;
}

export function defaultParams(): AllParams {
  return {
    common: {
      theme: { override: "auto" },
      palette: {
        // Dark: the site's own base (#0C0A09 = --background in .dark) and its primary
        // orange (#EA580C), pushed toward red, amber and hot gold, with a magenta drift.
        dark: {
          base: "#0C0A09",
          c0: "#F5321E",
          c1: "#EA580C",
          c2: "#FFB224",
          c3: "#FFD9A0",
          accent: "#FF3DCB",
        },
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
      particles: { size: 1, glow: 1 },
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
        poolMax: 0.3,
        poolSwell: 16,
        swellSpeed: 1,
        chop: 0.6,
        ripples: true,
        rippleAmp: 1,
      },
      atmosphere: {
        glow: 1,
        grain: 0.05,
        vignette: 0.45,
        chroma: 0.6,
        exposure: 1,
        whitePoint: 4,
      },
      sections: {
        showContent: false,
        seeThrough: true,
        aboutBlendDark: "screen",
        aboutBlendLight: "multiply",
      },
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

export function getParams(): AllParams {
  const g = globalThis as LwGlobal;
  if (!g.__lwParams) g.__lwParams = defaultParams();
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
    ripple: 0,
  },
};
