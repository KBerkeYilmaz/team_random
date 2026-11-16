// PROTOTYPE, never merge. Liquid Pour workshop: adaptive quality governor (issue #55,
// Android FPS). Watches the rAF frame time and steps quality down when frames are being
// dropped, then slowly back up. Never exceeds the starting tier's budget.
//
// Thresholds assume a 60 Hz display as the floor: a healthy frame there is 16.7 ms, so
// "slow" is an average above 20 ms (vsync dropping to 30 fps shows up as ~33 ms) and
// "comfortable" is an average at or under 17.5 ms.

const LEVELS = [
  { dprDelta: 0, frac: 1, ripples: true },
  { dprDelta: 0.25, frac: 1, ripples: true },
  { dprDelta: 0.25, frac: 0.75, ripples: true },
  { dprDelta: 0.5, frac: 0.75, ripples: true },
  { dprDelta: 0.5, frac: 0.56, ripples: true },
  { dprDelta: 0.5, frac: 0.56, ripples: false },
  { dprDelta: 0.5, frac: 0.42, ripples: false },
] as const;

export type QualityLevel = (typeof LEVELS)[number];

export class QualityGovernor {
  level = 0;
  avgMs = 16.7;
  private over = 0;
  private under = 0;
  private warm = 1.5;

  constructor(readonly pinned: boolean) {}

  get settings(): QualityLevel {
    return LEVELS[this.level];
  }

  /** Call after a build, variant switch, resize or tab resume. */
  warmUp(): void {
    this.warm = 1.5;
    this.over = 0;
    this.under = 0;
  }

  /** Returns true when the level changed and the engine must re-apply quality. */
  update(frameMs: number, dt: number): boolean {
    if (this.pinned) return false;
    if (this.warm > 0) {
      this.warm -= dt;
      this.avgMs = 16.7;
      return false;
    }
    this.avgMs += (frameMs - this.avgMs) * 0.08;
    if (this.avgMs > 20) {
      this.over += dt;
      this.under = 0;
    } else if (this.avgMs <= 17.5) {
      this.under += dt;
      this.over = 0;
    } else {
      this.over = 0;
      this.under = 0;
    }
    if (this.over > 2 && this.level < LEVELS.length - 1) {
      this.level++;
      this.warmUp();
      return true;
    }
    if (this.under > 8 && this.level > 0) {
      this.level--;
      this.warmUp();
      return true;
    }
    return false;
  }
}
