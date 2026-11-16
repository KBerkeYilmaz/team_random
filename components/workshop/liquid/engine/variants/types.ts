// PROTOTYPE, never merge. Liquid workshop: the contract every variant meets.
import type * as THREE from "three";

import type { AllParams, TierBudget, VariantKey } from "../params";
import type { RippleField } from "../ripple";
import type { SectionMetrics } from "../scroll";
import type { Fonts } from "../shapes";

/** Everything a variant needs for one frame. Screen px, origin top-left, y down. */
export interface FrameState {
  t: number;
  /** Simulation step in seconds (0 when frozen or under reduced motion). */
  dt: number;
  W: number;
  H: number;
  scrollY: number;
  /** 0 at the top of the page -> 1 at the bottom. */
  progress: number;
  /** Scroll delta this frame (px, +down), already clamped. Zero under reduced motion. */
  dy: number;
  velN: number;
  accN: number;
  reduced: boolean;
  /** 0 hero -> 1 hero fully scrolled out. */
  heroExit: number;
  /** How much liquid is pouring right now (spill in, calm out). */
  pour: number;
  /** Bottom-pool fill 0..1. */
  poolT: number;
  /** Where the liquid leaves the source (hero pool lip, or just above the viewport). */
  sourceY: number;
  /** Where the liquid meets the bottom pool's surface. */
  landY: number;
  sections: SectionMetrics;
  params: AllParams;
  /** True for one frame after __lw.settle(): snap to rest for clean screenshots. */
  settle: boolean;
}

/** Where the pour is, so the atmosphere can hang its light on it. */
export interface PourFocus {
  x: number;
  yTop: number;
  yBottom: number;
  width: number;
  intensity: number;
}

/** A landing on the bottom pool this frame (screen x, relative strength). */
export interface Impact {
  x: number;
  strength: number;
  radius: number;
}

export interface VariantContext {
  common: Record<string, THREE.IUniform>;
  budget: TierBudget;
  /** The engine's surface ripple tank (null when the device can't render float targets). */
  ripple: RippleField | null;
  /** The site's next/font families, for shapes drawn from text. */
  fonts: Fonts;
}

/** One of the background's light fields, in screen px. Colour in linear space. */
export interface GlowSpec {
  x: number;
  y: number;
  rx: number;
  ry: number;
  color: THREE.Color;
  intensity: number;
}

export interface VariantSystem {
  readonly key: VariantKey;
  readonly object: THREE.Object3D;
  /**
   * True when the variant draws its own liquid surfaces and lights (the cup): the engine
   * then hides the pour choreography's hero + bottom pools and uses `glows()`.
   */
  readonly ownsScene?: boolean;
  glows?(out: GlowSpec[]): void;
  /** Extra light fields on top of the engine's own (form: the glow behind each shape). */
  extraGlows?(out: GlowSpec[]): void;
  update(f: FrameState): void;
  focus(): PourFocus;
  /** Push this frame's impacts into `out` and clear them. */
  drainImpacts(out: Impact[]): void;
  setDrawFraction(frac: number): void;
  drawn(): number;
  dispose(): void;
}
