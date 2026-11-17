// PROTOTYPE, never merge. Liquid workshop: the contract every variant meets.
import type * as THREE from "three";

import type { AllParams, TierBudget, VariantKey } from "../params";
import type { PoolSystem } from "../pool";
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
  /** 0..1, how far the workshop nav's phone menu has flooded the screen. */
  flood: number;
  /**
   * Round 11: 0..1, a mouse (or pen) is over the page and has moved lately. Its position
   * is common.uPointer.xy. Drives form's cursor light.
   */
  cursor: number;
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
  /** The hero pool (engine-owned). form drains it into the falls and the first shape. */
  topPool: PoolSystem;
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

/**
 * Round 11: where the scroll should come to rest (form). The page settles onto the pillars
 * and a single flick can't carry it past one (engine/smooth.ts).
 */
export interface SnapStory {
  /** Where each pillar holds, in px of scroll, ascending (the snap points). */
  points: readonly number[];
  /**
   * Each pillar's free zone [from, to]: its shape fully formed and no hand-over started.
   * The scroll moves freely inside one; it only settles when it stops outside them all.
   */
  zones: readonly (readonly [number, number])[];
  /**
   * Round 13: before the first pillar the scroll may rest freely up to here (the pool and
   * the falls); past it the first shape is visibly forming.
   */
  rest: number;
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
  /** Variant state for __lw.state() and the panel's monitor (form: where the story is). */
  debug?(): { story?: string };
  /**
   * How far the hero pool has drained (form): where its liquid's back edge is, as a share
   * of its depth on screen (0 full, 1 at the near edge, beyond that empty). Moves + dims
   * its light.
   */
  poolDrain?(): number;
  /** Where the scroll should come to rest (form's pillars), or null when anywhere goes. */
  snap?(): SnapStory | null;
  update(f: FrameState): void;
  focus(): PourFocus;
  /** Push this frame's impacts into `out` and clear them. */
  drainImpacts(out: Impact[]): void;
  setDrawFraction(frac: number): void;
  drawn(): number;
  dispose(): void;
}
