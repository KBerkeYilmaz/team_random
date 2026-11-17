// PROTOTYPE, never merge. Liquid workshop, round 10: the page itself glides.
//
// The user, after round 9: "it's not at the premium motion feel I want it to be, scroll
// movements can be a bit slicker it feels a bit instant". A wheel notch used to jump the
// page 100px in one frame, and everything keyed to the scroll jumped with it. Lenis turns
// wheel and trackpad input into an inertial glide. Phones keep their native momentum
// (syncTouch off): touch scrolling already glides, and hijacking it feels wrong.
//
// The engine owns the instance and steps it at the top of its own frame, before it reads
// window.scrollY, so the liquid always draws the exact scroll position the frame shows (no
// one-frame lag between two rAF loops). The panel's Scroll folder retunes it live (Lenis
// reads its options on every input event). The nav reaches it through
// globalThis.__lwLenis to glide to a beat.
import Lenis from "lenis";

import type { CommonParams } from "./params";

export type LenisGlobal = typeof globalThis & { __lwLenis?: Lenis };

export class SmoothScroll {
  private readonly lenis: Lenis;

  constructor() {
    this.lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.08,
      // The workshop panel scrolls on its own.
      prevent: (node) => node.dataset?.lwPanel === "1",
    });
    (globalThis as LenisGlobal).__lwLenis = this.lenis;
  }

  /**
   * Steps the glide. `locked` holds the page still (the phone menu's flood); `reduced`
   * hands the wheel back to the browser.
   */
  frame(
    now: number,
    p: CommonParams["scroll"],
    locked: boolean,
    reduced: boolean,
  ): void {
    const o = this.lenis.options;
    o.smoothWheel = p.smooth && !reduced;
    o.lerp = p.glide;
    o.wheelMultiplier = p.wheel;
    if (locked && !this.lenis.isStopped) this.lenis.stop();
    else if (!locked && this.lenis.isStopped) this.lenis.start();
    this.lenis.raf(now);
  }

  dispose(): void {
    this.lenis.destroy();
    const g = globalThis as LenisGlobal;
    if (g.__lwLenis === this.lenis) delete g.__lwLenis;
  }
}
