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
// Round 14, the user on a phone: "when we scroll up the whole browser moves with it ...
// we need consistency" and "gestures should stick on each individual icon ... I can just
// skip 2 icons and hang on a half-built icon". Native touch scrolling let Safari slide its
// toolbar and rubber-band the page, and the CSS snap fallback did not hold on the phone.
// So Lenis now takes over touch too (syncTouch): the browser never scrolls natively. And
// touch is a pager: the stops are the top (the pool) and each pillar; every swipe moves
// exactly one stop forward or back, or springs back if it was too small. The finger
// drags the page 1:1 up to the next stop and with rubbery resistance past it; on release
// a spring carries the finger's own speed into the glide onto the chosen stop (no
// restart). A swipe made while a glide is still running counts from where that glide is
// heading, so quick swipes step one stop each. The panel can hand touch back to the
// browser (then the CSS snap markers below are the fallback).
import Lenis, { type VirtualScrollData } from "lenis";

import type { CommonParams } from "./params";
import { clamp, lerp } from "./scroll";
import type { SnapStory } from "./variants/types";

export type LenisGlobal = typeof globalThis & { __lwLenis?: Lenis };

/** Wheel silence (ms) that ends a gesture. Trackpad momentum keeps one gesture going. */
const GESTURE_GAP = 180;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** Apple's rubber band: the further past the limit, the less the page follows. */
const rubberband = (over: number, size: number) =>
  (over * size * 0.55) / (size + 0.55 * over);

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
  // Touch gestures (round 14): where the page was (base) and the stop it was at or heading
  // for (from) when the finger came down, and how far the finger has dragged since.
  private touch = { active: false, base: 0, from: 0, raw: 0 };
  // The glide onto a stop after a swipe: a critically damped spring (px, px/s), never
  // faster than `vmax` (the finger's own release speed, or a calm cruise if that was slow).
  private glide: { x: number; v: number; to: number; vmax: number } | null =
    null;
  // The page's own speed (px/s), measured from frame to frame.
  private vel = 0;
  private lastFrame = 0;
  // Phones: CSS snap markers (only when touch is left to the browser).
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
    // Debug handle (workshop only): the pager's state for the test harness.
    (globalThis as { __lwSmooth?: unknown }).__lwSmooth = this;
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
    const takeTouch = this.coarse.matches && p.smooth && p.touch && !reduced;
    o.syncTouch = takeTouch;
    if (locked && !this.lenis.isStopped) this.lenis.stop();
    else if (!locked && this.lenis.isStopped) this.lenis.start();

    const snapping = p.snap && !reduced && story !== null;
    this.story = story;
    this.catching =
      snapping && p.catch && p.smooth && (takeTouch || !this.coarse.matches);
    // A wheel glide may not carry past the pillar its gesture is caught at.
    this.guardCatch();
    const dt = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    // Touch: the spring that carries the page onto the chosen stop.
    if (this.glide && (locked || !takeTouch)) this.glide = null;
    if (this.glide && dt > 0) this.stepGlide(dt);
    this.lenis.raf(now);

    const y = this.lenis.scroll;
    if (dt > 0) this.vel = lerp(this.vel, (y - this.lastY) / dt, 0.6);
    if (Math.abs(y - this.lastY) > 0.5) {
      this.lastMoveAt = now;
      this.travelDir = Math.sign(y - this.lastY);
    }
    this.lastY = y;
    if (this.glide) return;

    this.syncMarkers(
      snapping && this.coarse.matches && !takeTouch && !locked,
      story,
    );
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
    const g = globalThis as LenisGlobal & { __lwSmooth?: unknown };
    if (g.__lwLenis === this.lenis) delete g.__lwLenis;
    if (g.__lwSmooth === this) delete g.__lwSmooth;
  }

  // ---- The catch ----------------------------------------------------------------------

  /** Lenis calls this with every wheel / touch input, before it moves its target. */
  private onInput = (data: VirtualScrollData): boolean => {
    const now = performance.now();
    const target = data.event.target as Element | null;
    if (target?.closest?.("[data-lw-panel]")) return true;
    this.handled = null;
    this.pendingBack = null;
    if (data.event.type.startsWith("touch")) return this.onTouch(data, now);
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

  /** The touch pager's stops: the top of the page (the pool) and each pillar. */
  private stops(): number[] {
    return this.story ? [0, ...this.story.points] : [0];
  }

  /** The stop nearest to `y`. */
  private nearestStop(y: number): number {
    const stops = this.stops();
    let best = 0;
    for (let i = 1; i < stops.length; i++) {
      if (Math.abs(stops[i] - y) < Math.abs(stops[best] - y)) best = i;
    }
    return best;
  }

  /**
   * Round 14: a touch swipe under Lenis (syncTouch), as a pager. The finger drags the
   * page 1:1 up to the neighbouring stop and with rubbery resistance past it; on release
   * the page glides onto the next stop (or back onto this one) on a spring that starts
   * at the finger's speed.
   */
  private onTouch(data: VirtualScrollData, now: number): boolean {
    this.lastInputAt = now;
    const lenis = this.lenis;
    if (!lenis.options.syncTouch || lenis.isStopped) return true;
    const type = data.event.type;
    if (type === "touchstart") {
      // A swipe made while a glide is still running counts from the stop that glide is
      // heading for. (Lenis halts any glide of its own right after this.)
      this.touch.from = this.glide
        ? this.nearestStop(this.glide.to)
        : this.nearestStop(lenis.actualScroll);
      this.glide = null;
      this.touch.base = lenis.actualScroll;
      this.touch.raw = 0;
      this.touch.active = true;
      this.gestureDir = 0;
      this.catchY = null;
      return true;
    }
    if (type !== "touchmove") {
      // Released: pick the stop and glide there; Lenis's own momentum is not used.
      this.touch.active = false;
      if (!this.catching) return true;
      this.release();
      return false;
    }
    const dy = data.deltaY;
    if (!dy) return true;
    this.touch.raw += dy;
    const dir = Math.sign(this.touch.raw) || Math.sign(dy);
    const stops = this.stops();
    const next = clamp(this.touch.from + dir, 0, stops.length - 1);
    this.gestureDir = dir;
    this.catchY =
      this.catching && next !== this.touch.from ? stops[next] : null;
    const free = this.touch.base + this.touch.raw;
    let want = free;
    if (this.catchY !== null) {
      const over = (free - this.catchY) * dir;
      if (over > 0)
        want = this.catchY + dir * rubberband(over, window.innerHeight);
    }
    data.deltaY = want - lenis.targetScroll;
    return true;
  }

  /** On release: one stop on in the swipe's direction if it went far or fast enough. */
  private release() {
    const stops = this.stops();
    const from = this.touch.from;
    const pos = this.lenis.animatedScroll;
    const v = clamp(this.vel, -7000, 7000);
    // Where the swipe was headed: where the finger left the page plus a short glide. Its
    // direction is the finger's (a swipe made mid-glide may start behind its stop, which
    // must not read as a swipe back).
    const projected = pos + v * 0.18;
    const dir = Math.sign(this.touch.raw) || Math.sign(v);
    let to = from;
    if (dir !== 0) {
      const next = clamp(from + dir, 0, stops.length - 1);
      const span = Math.abs(stops[next] - stops[from]) || 1;
      // The swipe's own travel, from where the finger came down: a quick swipe made while
      // the page still trails its stop counts just like one made at rest.
      if (next !== from && (projected - this.touch.base) * dir > 0.18 * span) {
        to = next;
      }
    }
    // A slow release glides at a calm cruise (about two screens a second, so the pour into
    // the first shape or a morph never rushes); a fast flick keeps its own speed.
    const vmax = Math.max(Math.abs(v), 2 * window.innerHeight);
    this.glide = { x: pos, v, to: stops[to], vmax };
    this.catchY = null;
  }

  /**
   * Steps the glide: a critically damped spring (response 0.55 s) from the finger's speed,
   * which never overshoots the stop (the next morph must not start), capped at vmax.
   */
  private stepGlide(dt: number) {
    const g = this.glide!;
    const w = (2 * Math.PI) / 0.55;
    const d = g.to - g.x;
    // Too much speed toward the stop would carry it past; keep what still lands.
    if (Math.sign(g.v) === Math.sign(d)) {
      g.v = Math.sign(g.v) * Math.min(Math.abs(g.v), 0.9 * w * Math.abs(d));
    }
    const sub = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / sub;
    for (let i = 0; i < sub; i++) {
      g.v += (w * w * (g.to - g.x) - 2 * w * g.v) * h;
      g.v = clamp(g.v, -g.vmax, g.vmax);
      g.x += g.v * h;
    }
    const done = Math.abs(g.to - g.x) < 0.5 && Math.abs(g.v) < 8;
    this.lenis.scrollTo(done ? g.to : g.x, { immediate: true, force: true });
    if (done) this.glide = null;
  }

  /** Keeps a user glide (a touch fling's momentum) from carrying past its catch. */
  private guardCatch() {
    const lenis = this.lenis;
    if (!this.catching || this.catchY === null || this.touch.active) return;
    if (lenis.isScrolling !== "smooth") return;
    const initiator = (lenis.userData as { initiator?: string } | undefined)
      ?.initiator;
    if (initiator) return;
    const t = lenis.targetScroll;
    const past =
      this.gestureDir > 0 ? t > this.catchY + 0.5 : t < this.catchY - 0.5;
    if (!past) return;
    lenis.scrollTo(this.catchY, {
      programmatic: false,
      lerp: lenis.options.syncTouch
        ? lenis.options.syncTouchLerp
        : lenis.options.lerp,
    });
  }

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
