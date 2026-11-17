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
//
// Round 11, the user: "scroll movement should snap to proper height so that people can see
// the actual images ... we should still have an area to move the scroll so it shouldn't be
// snap but move towards the snap", and "sometimes we can skip the shapes without actually
// seeing them in full effect". Two behaviours, both on the form story's pillars (SnapStory):
// - Settle: when the scroll stops between pillars, the page glides onto the one it was
//   heading for (or back onto the one it barely left). Inside a pillar's hold (its free
//   zone) nothing happens: that is the area to move in. A wheel glide is bent onto the
//   pillar while still moving, at its own speed, rather than stopped and restarted.
// - Catch: one wheel or trackpad gesture (its momentum included) carries the page at most
//   to the next pillar, landing on it softly. Scroll again to go on. Keyboard, scrollbar
//   and the nav's links are deliberate jumps and are never caught.
// Phones scroll natively, so there the browser does both: CSS proximity snap points with
// scroll-snap-stop: always (html[data-lw-snap="touch"], markers at the pillars).
import Lenis, { type VirtualScrollData } from "lenis";

import type { CommonParams } from "./params";
import { clamp } from "./scroll";
import type { SnapStory } from "./variants/types";

export type LenisGlobal = typeof globalThis & { __lwLenis?: Lenis };

/** Wheel silence (ms) that ends a gesture. Trackpad momentum keeps one gesture going. */
const GESTURE_GAP = 180;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/**
 * Where a gesture starting at `from` and heading `dir` gets caught: the next pillar ahead
 * whose hold it is not already inside. Null when there is none.
 */
function catchPoint(story: SnapStory, from: number, dir: number) {
  const { points, zones } = story;
  if (dir > 0) {
    for (let k = 0; k < points.length; k++) {
      if (zones[k][0] > from + 1) return points[k];
    }
  } else {
    for (let k = points.length - 1; k >= 0; k--) {
      if (zones[k][1] < from - 1) return points[k];
    }
  }
  return null;
}

/**
 * Where the scroll should settle if it comes to rest at `dest` while travelling `dir`; null
 * to leave it be (inside a pillar's hold, or resting in the pool and the falls before the
 * first one).
 */
function settleTarget(
  story: SnapStory,
  dest: number,
  dir: number,
  vh: number,
  strict: boolean,
): number | null {
  const { points, zones } = story;
  const n = points.length;
  if (n === 0) return null;
  for (let k = 0; k < n; k++) {
    if (dest >= zones[k][0] && dest <= zones[k][1]) return null;
  }
  if (dest < zones[0][0] && strict) {
    // Touch (round 13): the page rides the finger, so it may rest in the pool and the
    // falls, but never on a half-formed first shape: once it is visibly forming, it
    // finishes (or, barely started, backs off to the falls).
    if (dest <= story.rest) return null;
    const m = (dest - story.rest) / Math.max(1, zones[0][0] - story.rest);
    return dir > 0 || m > 0.5 ? points[0] : story.rest;
  }
  if (dest < zones[0][0]) {
    // Before the first pillar the pool and the falls are fine to rest in; only once the
    // first shape is more than half formed does it settle onto it (round 12: was 0.8 of
    // a screen, which glided the whole pour through too fast).
    const gap = zones[0][0] - dest;
    return gap <= 0.2 * vh || (dir > 0 && gap <= 0.45 * vh) ? points[0] : null;
  }
  if (dest > zones[n - 1][1]) return points[n - 1];
  // Between two pillars: the one the scroll was heading for, unless it had barely left the
  // other (a small band of regret on each side).
  let k = 0;
  while (k < n - 2 && dest >= zones[k + 1][0]) k++;
  const from = zones[k][1];
  const to = zones[k + 1][0];
  const m = (dest - from) / Math.max(1, to - from);
  const forward = dir >= 0 ? m > 0.2 : m > 0.8;
  return forward ? points[k + 1] : points[k];
}

export class SmoothScroll {
  private readonly lenis: Lenis;
  private story: SnapStory | null = null;
  private catching = false;
  // Wheel gestures (the catch).
  private lastInputAt = -1e9;
  private gestureDir = 0;
  private catchY: number | null = null;
  private caughtAt = 0;
  private lastAbs = 0;
  // Movement (any source) and the settle.
  private lastY = 0;
  private lastMoveAt = -1e9;
  private travelDir = 0;
  private handled: number | null = null;
  private pendingBack: number | null = null;
  private pointerDown = false;
  // Phones: CSS snap markers.
  private readonly coarse = window.matchMedia("(pointer: coarse)");
  private markers: HTMLDivElement | null = null;
  private markerKey = "";

  constructor() {
    this.lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.08,
      // The workshop panel scrolls on its own.
      prevent: (node) => node.dataset?.lwPanel === "1",
      virtualScroll: this.onInput,
    });
    (globalThis as LenisGlobal).__lwLenis = this.lenis;
    this.lastY = this.lenis.scroll;
    window.addEventListener("pointerdown", this.onPointerDown, true);
    window.addEventListener("pointerup", this.onPointerUp, true);
    window.addEventListener("pointercancel", this.onPointerUp, true);
  }

  /**
   * Steps the glide. `locked` holds the page still (the phone menu's flood); `reduced`
   * hands the wheel back to the browser; `story` is where the scroll may come to rest.
   */
  frame(
    now: number,
    p: CommonParams["scroll"],
    locked: boolean,
    reduced: boolean,
    story: SnapStory | null,
  ): void {
    const o = this.lenis.options;
    o.smoothWheel = p.smooth && !reduced;
    o.lerp = p.glide;
    o.wheelMultiplier = p.wheel;
    if (locked && !this.lenis.isStopped) this.lenis.stop();
    else if (!locked && this.lenis.isStopped) this.lenis.start();

    const snapping = p.snap && !reduced && story !== null;
    this.story = story;
    this.catching = snapping && p.catch && p.smooth && !this.coarse.matches;
    this.lenis.raf(now);

    const y = this.lenis.scroll;
    if (Math.abs(y - this.lastY) > 0.5) {
      this.lastMoveAt = now;
      this.travelDir = Math.sign(y - this.lastY);
    }
    this.lastY = y;

    this.syncMarkers(snapping && this.coarse.matches && !locked, story);
    if (!snapping || locked || this.pointerDown) {
      this.pendingBack = null;
      return;
    }
    // Round 13: phones settle too (after the native momentum and the browser's own snap
    // have finished), so a swipe never leaves a half-formed shape on screen.
    this.settle(
      now,
      this.coarse.matches ? Math.max(p.settleDelay, 240) : p.settleDelay,
    );
  }

  dispose(): void {
    window.removeEventListener("pointerdown", this.onPointerDown, true);
    window.removeEventListener("pointerup", this.onPointerUp, true);
    window.removeEventListener("pointercancel", this.onPointerUp, true);
    this.syncMarkers(false, null);
    this.lenis.destroy();
    const g = globalThis as LenisGlobal;
    if (g.__lwLenis === this.lenis) delete g.__lwLenis;
  }

  // ---- The catch ----------------------------------------------------------------------

  /** Lenis calls this with every wheel / touch input, before it moves its target. */
  private onInput = (data: VirtualScrollData): boolean => {
    const now = performance.now();
    const target = data.event.target as Element | null;
    if (target?.closest?.("[data-lw-panel]")) return true;
    this.handled = null;
    this.pendingBack = null;
    const dy = data.deltaY;
    const dir = Math.sign(dy);
    if (data.event.type !== "wheel" || dir === 0) {
      this.lastInputAt = now;
      return true;
    }
    const abs = Math.abs(dy);
    // A new gesture: after a pause, on a change of direction, or a fresh push while caught
    // (trackpad momentum only ever decays, so a jump in strength is the user again).
    const fresh =
      now - this.lastInputAt > GESTURE_GAP ||
      dir !== this.gestureDir ||
      (this.caughtAt > 0 &&
        now - this.caughtAt > 260 &&
        abs > Math.max(8, this.lastAbs * 1.6));
    this.lastInputAt = now;
    this.lastAbs = abs;
    if (fresh) {
      this.gestureDir = dir;
      this.caughtAt = 0;
      this.catchY =
        this.catching && this.story
          ? catchPoint(this.story, this.lenis.targetScroll, dir)
          : null;
    }
    if (this.catching && this.catchY !== null) {
      const from = this.lenis.targetScroll;
      if (dir > 0 ? from + dy > this.catchY : from + dy < this.catchY) {
        data.deltaY =
          dir > 0
            ? Math.max(0, this.catchY - from)
            : Math.min(0, this.catchY - from);
        if (!this.caughtAt) this.caughtAt = now;
      }
    }
    return true;
  };

  // ---- The settle ---------------------------------------------------------------------

  private settle(now: number, delay: number) {
    const lenis = this.lenis;
    // Still scrolling (wheel input within the delay).
    if (now - this.lastInputAt < delay) return;
    const initiator = (lenis.userData as { initiator?: string } | undefined)
      ?.initiator;
    const smoothing = lenis.isScrolling === "smooth";
    // A nav link's glide lands on a pillar by itself; a settle is already on its way.
    if (smoothing && (initiator === "nav" || initiator === "settle")) return;

    if (this.pendingBack !== null) {
      // Waiting for a glide that overshot to come to rest before easing back.
      if (now - this.lastMoveAt > 50) {
        const back = this.pendingBack;
        this.pendingBack = null;
        this.go(back, false);
      }
      return;
    }

    // Where the scroll is headed: a wheel glide's destination while it is still gliding
    // (so it can be bent onto the pillar in flight); otherwise where it stopped (keyboard,
    // scrollbar, a glide that has already landed).
    let dest: number;
    if (smoothing) dest = lenis.targetScroll;
    else {
      if (now - this.lastMoveAt < delay) return;
      dest = lenis.scroll;
    }
    if (this.handled !== null && Math.abs(dest - this.handled) < 1) return;
    this.handled = dest;
    const target = settleTarget(
      this.story!,
      dest,
      this.travelDir,
      window.innerHeight,
      this.coarse.matches,
    );
    if (target === null || Math.abs(target - dest) < 2) return;
    const ahead = Math.sign(target - lenis.animatedScroll);
    const moving =
      Math.abs(lenis.velocity) > 0.3 ? Math.sign(lenis.velocity) : 0;
    if (smoothing && moving !== 0 && moving !== ahead) {
      // The glide is heading away from the pillar: let it finish, then ease back.
      this.pendingBack = target;
      return;
    }
    this.go(target, smoothing && moving === ahead);
  }

  /** Glides onto `target`: bending a moving glide at its own speed, or easing from rest. */
  private go(target: number, carry: boolean) {
    const lenis = this.lenis;
    const dist = Math.abs(target - lenis.animatedScroll);
    if (carry) {
      // Lerp mode moves `lerp` of the remaining distance per frame, so this keeps the
      // glide's current speed and decelerates it onto the pillar.
      lenis.scrollTo(target, {
        lerp: clamp(Math.abs(lenis.velocity) / Math.max(1, dist), 0.035, 0.12),
        userData: { initiator: "settle" },
      });
    } else {
      lenis.scrollTo(target, {
        duration: clamp(0.55 + (dist / window.innerHeight) * 0.7, 0.6, 1.4),
        easing: easeInOutCubic,
        userData: { initiator: "settle" },
      });
    }
  }

  private onPointerDown = (event: PointerEvent) => {
    // A held mouse button (the scrollbar, a drag) or a finger on the screen: never move
    // the page under it.
    if (event.isPrimary) this.pointerDown = true;
  };

  private onPointerUp = (event: PointerEvent) => {
    if (event.isPrimary) this.pointerDown = false;
  };

  // ---- Phones: the browser's own snap -------------------------------------------------

  private syncMarkers(on: boolean, story: SnapStory | null) {
    const html = document.documentElement;
    // Programmatic glides (the nav) would be re-snapped mid-flight: snap off meanwhile.
    const active = on && story !== null && this.lenis.isScrolling !== "smooth";
    if (active) html.dataset.lwSnap = "touch";
    else delete html.dataset.lwSnap;
    if (!on || !story) {
      this.markers?.remove();
      this.markers = null;
      this.markerKey = "";
      return;
    }
    const key = story.points.map((y) => Math.round(y)).join(",");
    if (key === this.markerKey && this.markers?.isConnected) return;
    this.markerKey = key;
    if (!this.markers) {
      this.markers = document.createElement("div");
      this.markers.dataset.lwSnapMarkers = "";
      this.markers.setAttribute("aria-hidden", "true");
    }
    if (!this.markers.isConnected) document.body.appendChild(this.markers);
    this.markers.replaceChildren(
      ...story.points.map((y) => {
        const mark = document.createElement("div");
        mark.className = "lw-snap-mark";
        mark.style.top = `${Math.round(y)}px`;
        return mark;
      }),
    );
  }
}
