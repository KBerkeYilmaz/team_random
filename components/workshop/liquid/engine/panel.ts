// PROTOTYPE, never merge. Liquid Pour workshop: the live tuning panel (Tweakpane v4).
// It binds straight to the params object the engine reads every frame, so tweaks are
// instant and never re-render React. "Copy settings JSON" is how a tuned look gets
// captured into the conversation / the eventual production issue.
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import type { FpsGraphBladeApi } from "@tweakpane/plugin-essentials";
import { Pane, type FolderApi } from "tweakpane";

import {
  assignDeep,
  defaultParams,
  LOOKS,
  type AllParams,
  type PaletteParams,
  type VariantKey,
} from "./params";
import { SHAPES } from "./shapes";

export interface PanelStats {
  variant: string;
  tier: string;
  level: number;
  dpr: number;
  particles: number;
  scroll: number;
  velocity: number;
  /** form: which shape is pouring / holding / melting. */
  story: string;
}

export interface Panel {
  stats: PanelStats;
  fpsBegin(): void;
  fpsEnd(): void;
  setVariant(key: VariantKey): void;
  dispose(): void;
}

const BLENDS = {
  normal: "normal",
  screen: "screen",
  lighten: "lighten",
  "plus-lighter": "plus-lighter",
  multiply: "multiply",
  darken: "darken",
  overlay: "overlay",
};

const PALETTE_LABELS: Record<keyof PaletteParams, string> = {
  base: "base",
  c0: "edge / trough",
  c1: "core",
  c2: "warm",
  c3: "hot crest",
  accent: "hue drift",
};

export function createPanel(opts: {
  params: AllParams;
  variant: VariantKey;
  getExport: () => object;
  onStructural: () => void;
}): Panel {
  const { params } = opts;
  const container = document.createElement("div");
  container.className = "lw-hud lw-panel";
  container.dataset.lwPanel = "1";
  document.body.appendChild(container);

  const pane = new Pane({ container, title: "Liquid workshop (prototype)" });
  pane.registerPlugin(EssentialsPlugin);

  const stats: PanelStats = {
    variant: opts.variant,
    tier: "",
    level: 0,
    dpr: 1,
    particles: 0,
    scroll: 0,
    velocity: 0,
    story: "",
  };

  const monitor = pane.addFolder({ title: "Monitor", expanded: true });
  const fps = monitor.addBlade({
    view: "fpsgraph",
    label: "fps",
    rows: 2,
  }) as FpsGraphBladeApi;
  monitor.addBinding(stats, "variant", { readonly: true });
  monitor.addBinding(stats, "tier", { readonly: true });
  monitor.addBinding(stats, "level", { readonly: true, label: "quality step" });
  monitor.addBinding(stats, "dpr", {
    readonly: true,
    format: (v: number) => v.toFixed(2),
  });
  monitor.addBinding(stats, "particles", {
    readonly: true,
    format: (v: number) => v.toFixed(0),
  });
  monitor.addBinding(stats, "scroll", {
    readonly: true,
    format: (v: number) => v.toFixed(0),
  });
  monitor.addBinding(stats, "velocity", {
    readonly: true,
    label: "vel (vh/s)",
    format: (v: number) => v.toFixed(2),
  });
  monitor.addBinding(stats, "story", { readonly: true });

  let variantFolder: FolderApi | null = null;
  const buildVariantFolder = (key: VariantKey) => {
    variantFolder?.dispose();
    const folder = pane.addFolder({
      title: `Pour: ${key}`,
      expanded: true,
      index: 1,
    });
    if (key === "form") {
      const m = params.form;
      const shapeOptions: Record<string, string> = {
        "auto (scroll scrubs)": "auto",
      };
      for (const spec of SHAPES) shapeOptions[spec.key] = spec.key;
      folder.addBinding(m, "shape", { options: shapeOptions });
      folder.addBinding(m, "firstFrom", {
        label: "first shape from",
        options: {
          "the falls": "falls",
          "the pool": "pool",
          above: "above",
        },
      });
      folder.addBinding(m, "fallFirst", {
        min: 0.1,
        max: 0.8,
        label: "fall before turning",
      });
      folder.addBinding(m, "firstSlot", {
        min: 1,
        max: 3,
        label: "pool → code stretch",
      });
      folder.addBinding(m, "poolToFalls", {
        min: 0,
        max: 1,
        label: "slow drain share",
      });
      folder.addBinding(m, "handover", {
        label: "hand-over",
        options: { "morph (puddle, rise)": "morph", "melt + pour": "melt" },
      });
      folder.addBinding(m, "puddle", {
        label: "morph puddle",
        options: { "under the shape": "base", "dives into the pool": "pool" },
      });
      folder.addBinding(m, "reflect", {
        min: 0,
        max: 1.5,
        label: "reflections",
      });
      folder.addBinding(m, "pourLen", {
        min: 0.1,
        max: 0.6,
        label: "pour share",
      });
      folder.addBinding(m, "meltLen", {
        min: 0.1,
        max: 0.6,
        label: "melt share",
      });
      folder.addBinding(m, "scrub", {
        min: 0,
        max: 1.2,
        label: "scrub smooth (s)",
      });
      folder.addBinding(m, "splash", {
        min: 0,
        max: 2,
        label: "fling splash",
      });
      folder.addBinding(m, "shapeSize", {
        min: 0.4,
        max: 1.6,
        label: "shape size",
      });
      folder.addBinding(m, "shapeY", {
        min: 0.2,
        max: 0.7,
        label: "shape height",
      });
      folder.addBinding(m, "wobble", { min: 0, max: 8 });
      folder.addBinding(m, "glint", { min: 0, max: 2 });
      folder.addBinding(m, "drips", {
        min: 0,
        max: 2,
        label: "drips + trickle",
      });
      folder.addBinding(m, "follow", {
        min: 0,
        max: 2,
        label: "follow scroll",
      });
      folder.addBinding(m, "shapeGlow", {
        min: 0,
        max: 3,
        label: "shape glow",
      });
      folder.addBinding(m, "sheetVeil", {
        min: 0,
        max: 1,
        label: "dim cascade",
      });
      const behind = folder.addFolder({
        title: "Cascade behind",
        expanded: false,
      });
      behind.addBinding(m, "veil", { min: 0, max: 1, label: "centre veil" });
      behind.addBinding(m, "veilWidth", {
        min: 0.05,
        max: 1,
        label: "veil width",
      });
      behind.addBinding(m, "mist", { min: 0, max: 2 });
      behind.addBinding(m, "sway", { min: 0, max: 2 });
      behind.addBinding(m, "thinning", { min: 0, max: 1 });
    } else if (key === "cup") {
      const c = params.cup;
      folder.addBinding(c, "fillStart", {
        min: 0,
        max: 0.95,
        label: "fill at top",
      });
      folder.addBinding(c, "fillEnd", {
        min: 0,
        max: 0.95,
        label: "fill at bottom",
      });
      folder.addBinding(c, "surfaceDepth", {
        min: 0,
        max: 0.4,
        label: "surface depth",
      });
      folder.addBinding(c, "heave", { min: 0, max: 3, label: "heave + slosh" });
      folder.addBinding(c, "wallSplash", {
        min: 0,
        max: 3,
        label: "wall splash",
      });
      folder.addBinding(c, "meniscus", { min: 0, max: 2 });
      folder.addBinding(c, "bubbles", { min: 0, max: 2 });
      folder.addBinding(c, "bodyGlow", { min: 0, max: 3, label: "body glow" });
    } else if (key === "stream") {
      const s = params.stream;
      folder.addBinding(s, "width", { min: 8, max: 160, step: 1 });
      folder.addBinding(s, "meander", { min: 0, max: 160 });
      folder.addBinding(s, "bend", {
        min: 0,
        max: 1,
        label: "bend (riverbed)",
      });
      folder.addBinding(s, "splash", { min: 0, max: 2 });
      folder.addBinding(s, "xHero", { min: 0, max: 1, label: "x hero" });
      folder.addBinding(s, "xAbout", { min: 0, max: 1, label: "x about" });
      folder.addBinding(s, "xServices", {
        min: 0,
        max: 1,
        label: "x services",
      });
      folder.addBinding(s, "xCta", { min: 0, max: 1, label: "x contact" });
    } else if (key === "cascade") {
      const c = params.cascade;
      folder.addBinding(c, "veil", { min: 0, max: 1, label: "centre veil" });
      folder.addBinding(c, "veilWidth", {
        min: 0.05,
        max: 1,
        label: "veil width",
      });
      folder.addBinding(c, "mist", { min: 0, max: 2 });
      folder.addBinding(c, "sway", { min: 0, max: 2 });
      folder.addBinding(c, "thinning", { min: 0, max: 1 });
    } else {
      const d = params.drip;
      folder.addBinding(d, "count", { min: 1, max: 9, step: 1 });
      folder.addBinding(d, "detach", {
        min: 0.3,
        max: 2,
        label: "detach length",
      });
      folder.addBinding(d, "growth", { min: 0, max: 3 });
      folder.addBinding(d, "gravity", { min: 0.2, max: 3 });
      folder.addBinding(d, "bulb", { min: 0.4, max: 2, label: "bulb size" });
      folder.addBinding(d, "film", { min: 0, max: 3, label: "film" });
    }
    variantFolder = folder;
  };
  buildVariantFolder(opts.variant);

  const C = params.common;
  const liquid = pane.addFolder({ title: "Liquid feel", expanded: true });
  liquid.addBinding(C.liquid, "response", {
    min: 0.15,
    max: 2,
    label: "viscosity (s)",
  });
  liquid.addBinding(C.liquid, "damping", {
    min: 0.2,
    max: 1.2,
    label: "damping",
  });
  liquid.addBinding(C.liquid, "attach", {
    min: 0,
    max: 1.5,
    label: "drag w/ page",
  });
  liquid.addBinding(C.liquid, "slosh", { min: 0, max: 2 });
  liquid.addBinding(C.liquid, "flow", { min: 0, max: 1, label: "flow speed" });
  liquid.addBinding(C.liquid, "turbulence", { min: 0, max: 1.5 });
  liquid.addBinding(C.particles, "size", {
    min: 0.4,
    max: 3,
    label: "particle size",
  });
  liquid.addBinding(C.particles, "glow", {
    min: 0.2,
    max: 3,
    label: "particle glow",
  });
  liquid.addBinding(C.interaction, "pointer", {
    min: 0,
    max: 2,
    label: "cursor touch",
  });

  const pools = pane.addFolder({ title: "Pools", expanded: false });
  pools.addBinding(C.pools, "heroHorizon", {
    min: 0.5,
    max: 0.97,
    label: "hero horizon",
  });
  pools.addBinding(C.pools, "heroDepth", {
    min: 2,
    max: 14,
    label: "hero depth",
  });
  pools.addBinding(C.pools, "heroSwell", {
    min: 0,
    max: 40,
    label: "hero swell",
  });
  pools.addBinding(C.pools, "poolMax", {
    min: 0,
    max: 0.6,
    label: "pool fill max",
  });
  pools.addBinding(C.pools, "poolSwell", {
    min: 0,
    max: 40,
    label: "pool swell",
  });
  pools.addBinding(C.pools, "swellSpeed", {
    min: 0,
    max: 3,
    label: "swell speed",
  });
  pools.addBinding(C.pools, "chop", { min: 0, max: 3, label: "scroll chop" });
  pools.addBinding(C.pools, "ripples").on("change", opts.onStructural);
  pools.addBinding(C.pools, "rippleAmp", {
    min: 0,
    max: 3,
    label: "ripple amp",
  });

  const atmosphere = pane.addFolder({ title: "Atmosphere", expanded: false });
  atmosphere.addBinding(C.atmosphere, "glow", {
    min: 0,
    max: 3,
    label: "light fields",
  });
  atmosphere.addBinding(C.atmosphere, "exposure", { min: 0.3, max: 3 });
  atmosphere.addBinding(C.atmosphere, "whitePoint", {
    min: 1,
    max: 10,
    label: "white point",
  });
  atmosphere.addBinding(C.atmosphere, "grain", { min: 0, max: 0.2 });
  atmosphere.addBinding(C.atmosphere, "vignette", { min: 0, max: 1.2 });
  atmosphere.addBinding(C.atmosphere, "chroma", {
    min: 0,
    max: 3,
    label: "speed chroma",
  });
  atmosphere.addBinding(C.atmosphere, "dots", {
    min: 0,
    max: 1,
    label: "LED dots",
  });
  atmosphere.addBinding(C.atmosphere, "dotSpacing", {
    min: 2,
    max: 14,
    label: "dot pitch (px)",
  });

  const palette = pane.addFolder({ title: "Theme + palette", expanded: false });
  palette.addBinding(C.theme, "override", {
    label: "theme",
    options: { "follow site": "auto", dark: "dark", light: "light" },
  });
  // Looks fill the additive ("dark") palette plus their atmosphere in one go.
  const lookOptions: Record<string, string> = { custom: "custom" };
  for (const key of Object.keys(LOOKS)) lookOptions[key] = key;
  palette
    .addBinding(C.palette, "look", { options: lookOptions })
    .on("change", (ev) => {
      const look = LOOKS[ev.value as string];
      if (!look) return;
      Object.assign(C.palette.dark, look.palette);
      Object.assign(C.atmosphere, look.atmosphere);
      C.particles.glow = look.particleGlow;
      pane.refresh();
    });
  const addPalette = (title: string, pal: PaletteParams) => {
    const folder = palette.addFolder({ title, expanded: false });
    for (const key of Object.keys(PALETTE_LABELS) as (keyof PaletteParams)[]) {
      folder.addBinding(pal, key, { label: PALETTE_LABELS[key] });
    }
  };
  addPalette("Dark: glow", C.palette.dark);
  addPalette("Light: ink", C.palette.light);
  palette.addBinding(C.palette, "hueDrift", {
    min: 0,
    max: 1,
    label: "hue drift",
  });
  palette.addBinding(C.palette, "jitterDeg", {
    min: 0,
    max: 30,
    step: 1,
    label: "hue jitter °",
  });

  const sections = pane.addFolder({ title: "Sections", expanded: false });
  sections.addBinding(C.sections, "showContent", {
    label: "show site content",
  });
  sections.addBinding(C.sections, "seeThrough", { label: "see-through" });
  sections.addBinding(C.sections, "aboutBlendDark", {
    label: "lamp blend (dark)",
    options: BLENDS,
  });
  sections.addBinding(C.sections, "aboutBlendLight", {
    label: "lamp blend (light)",
    options: BLENDS,
  });

  const capture = pane.addFolder({ title: "Capture", expanded: true });
  const copyButton = capture.addButton({ title: "Copy settings JSON" });
  copyButton.on("click", () => {
    const json = JSON.stringify(opts.getExport(), null, 2);
    console.info("[liquid workshop] settings\n" + json);
    const done = (label: string) => {
      copyButton.title = label;
      window.setTimeout(() => (copyButton.title = "Copy settings JSON"), 1400);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(json).then(
        () => done("Copied"),
        () => window.prompt("Copy the settings JSON:", json),
      );
    } else {
      window.prompt("Copy the settings JSON:", json);
    }
  });
  capture.addButton({ title: "Paste settings JSON" }).on("click", () => {
    const text = window.prompt("Paste a settings JSON (from Copy):");
    if (!text) return;
    try {
      const parsed = JSON.parse(text) as { params?: unknown };
      assignDeep(params, parsed.params ?? parsed);
      pane.refresh();
      opts.onStructural();
    } catch (err) {
      window.alert(`That JSON could not be read: ${(err as Error).message}`);
    }
  });
  let currentVariant = opts.variant;
  capture.addButton({ title: "Reset this pour" }).on("click", () => {
    assignDeep(params[currentVariant], defaultParams()[currentVariant]);
    pane.refresh();
    opts.onStructural();
  });
  capture.addButton({ title: "Reset everything" }).on("click", () => {
    assignDeep(params, defaultParams());
    pane.refresh();
    opts.onStructural();
  });

  return {
    stats,
    fpsBegin: () => fps.begin(),
    fpsEnd: () => fps.end(),
    setVariant(key: VariantKey) {
      currentVariant = key;
      stats.variant = key;
      buildVariantFolder(key);
    },
    dispose() {
      pane.dispose();
      container.remove();
    },
  };
}
