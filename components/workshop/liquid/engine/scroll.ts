// PROTOTYPE, never merge. Liquid Pour workshop: scroll input without React state and
// without a scroll listener. The engine polls window.scrollY once per rAF frame, so the
// liquid reads exactly the scroll position that frame paints.

export interface SectionMetrics {
  heroTop: number;
  heroBottom: number;
  aboutTop: number;
  aboutBottom: number;
  servicesTop: number;
  servicesBottom: number;
  ctaTop: number;
  ctaBottom: number;
  docH: number;
}

/** Frame-rate-independent exponential smoothing toward `b` (lambda ~ 1/time-constant). */
export function damp(a: number, b: number, lambda: number, dt: number): number {
  return a + (b - a) * (1 - Math.exp(-lambda * dt));
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Spring constants from Apple-style "response" (seconds) and damping ratio. */
export function springConstants(response: number, dampingRatio: number) {
  const omega = (2 * Math.PI) / Math.max(0.05, response);
  return { k: omega * omega, c: 2 * dampingRatio * omega };
}

export class ScrollTracker {
  y = 0;
  dy = 0;
  /** px per second, raw. */
  vel = 0;
  /** viewports per second, smoothed. */
  velN = 0;
  /** viewports per second squared, smoothed. Drives the slosh impulse. */
  accN = 0;
  sections: SectionMetrics;
  private prevY = 0;

  constructor() {
    this.y = this.prevY = window.scrollY;
    this.sections = this.read();
  }

  measure(): void {
    this.sections = this.read();
  }

  update(dt: number, viewportH: number): void {
    this.y = window.scrollY;
    this.dy = this.y - this.prevY;
    this.prevY = this.y;
    // A jump bigger than a viewport in one frame is navigation (anchor link, scroll
    // restoration), not a gesture. Don't let it fling the liquid.
    if (Math.abs(this.dy) > viewportH) this.dy = 0;
    this.vel = dt > 0 ? this.dy / dt : 0;
    const prev = this.velN;
    this.velN = damp(this.velN, this.vel / Math.max(1, viewportH), 10, dt);
    const acc = dt > 0 ? (this.velN - prev) / dt : 0;
    this.accN = damp(this.accN, acc, 6, dt);
  }

  private read(): SectionMetrics {
    const sy = window.scrollY;
    const vh = window.innerHeight;
    const docH = Math.max(document.documentElement.scrollHeight, vh);
    const box = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top + sy, bottom: r.bottom + sy };
    };
    const hero = box("hero") ?? { top: 0, bottom: vh };
    const about = box("about") ?? {
      top: hero.bottom,
      bottom: hero.bottom + vh,
    };
    const services = box("services") ?? {
      top: about.bottom,
      bottom: about.bottom + vh,
    };
    const cta = box("cta") ?? {
      top: Math.max(services.bottom, docH - vh),
      bottom: docH,
    };
    // Round 10: the form variant's story track can make the page much longer than its
    // (hidden) sections. The contact beat is then the end of the page, so the falls run dry
    // and the pool settles at the end of the story, not halfway through it.
    const tail = docH - cta.bottom;
    if (tail > vh) {
      cta.top += tail;
      cta.bottom += tail;
    }
    return {
      heroTop: hero.top,
      heroBottom: hero.bottom,
      aboutTop: about.top,
      aboutBottom: about.bottom,
      servicesTop: services.top,
      servicesBottom: services.bottom,
      ctaTop: cta.top,
      ctaBottom: cta.bottom,
      docH,
    };
  }
}
