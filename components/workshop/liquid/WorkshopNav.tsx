"use client";
// PROTOTYPE, never merge. Liquid workshop, round 9: the glass pill navbar the user picked
// ("navbar glass pill works really well"). It replaces the site's navbar while the
// workshop is on (workshop.css hides the old one).
//
// Wide screens: brand, Work · Services · About and "Let's talk" in a frosted pill floating
// over the liquid.
// - A thin line of liquid fills along its bottom edge as you go down the page.
// - A droplet marks the active link: under Services while the pillars play. At the
//   contact beat it runs over to "Let's talk" and pours into it, and the button fills up.
//   Its two edges ride separate springs (the leading one quicker), so it stretches toward
//   the next link and gathers up behind it, like a drop.
// Phones: brand + Menu. Opening the menu frosts the page behind a blurred, tinted backdrop
// (round 13; it used to flood the screen with the liquid, which the user found "a bit too
// much") and the links come up in big type; closing fades it all out.
//
// The story (which beat is on, where each beat holds) comes from the form variant:
// html[data-lw-beat] and globalThis.__lwBeats. Continuous values never touch React state;
// one rAF loop writes styles directly. Round 10: links glide there through the engine's
// Lenis (globalThis.__lwLenis), which the menu's flood also holds still.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { clamp, damp, springConstants } from "./engine/scroll";
import type { LenisGlobal } from "./engine/smooth";
import { PILLARS } from "./story";

type StoryGlobal = LenisGlobal & { __lwBeats?: Record<string, number> };

const PILLAR_KEYS = new Set(PILLARS.map((pillar) => pillar.key));

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Quartic ease-in-out: a calm start and a long, soft landing. */
const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;

/**
 * Glides to where a beat of the story holds (or to an anchor without one). Round 10: through
 * the engine's Lenis, taking longer the further it goes, so a jump across the whole story
 * plays it through instead of cutting.
 */
function scrollToBeat(key: string, fallback: string) {
  const g = globalThis as StoryGlobal;
  const reduce = reducedMotion();
  const y = g.__lwBeats?.[key];
  if (typeof y !== "number") {
    document
      .querySelector(fallback)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    return;
  }
  const lenis = g.__lwLenis;
  if (!lenis || reduce) {
    window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    return;
  }
  const screens = Math.abs(y - window.scrollY) / window.innerHeight;
  lenis.scrollTo(y, {
    duration: clamp(0.9 + screens * 0.22, 1.1, 2.8),
    easing: easeInOutQuart,
    force: true,
    // Round 11: the page's settle leaves a nav glide alone (it lands on a pillar anyway).
    userData: { initiator: "nav" },
  });
}

interface Edge {
  x: number;
  v: number;
}

function stepSpring(
  e: Edge,
  target: number,
  s: { k: number; c: number },
  dt: number,
) {
  e.v += (s.k * (target - e.x) - s.c * e.v) * dt;
  e.x += e.v * dt;
}

export default function WorkshopNav() {
  const pillRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLSpanElement>(null);
  const servicesRef = useRef<HTMLAnchorElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = useState(false);

  // The droplet, the progress line and the "Let's talk" fill.
  useEffect(() => {
    const pill = pillRef.current;
    const drop = dropRef.current;
    const services = servicesRef.current;
    const cta = ctaRef.current;
    if (!pill || !drop || !services || !cta) return;
    const left: Edge = { x: 0, v: 0 };
    const right: Edge = { x: 0, v: 0 };
    const fast = springConstants(0.26, 0.82);
    const slow = springConstants(0.5, 0.9);
    const fillSpring = springConstants(0.7, 0.72);
    let placed = false;
    let opacity = 0;
    let fill = 0;
    let fillV = 0;
    let progress = 0;
    let poured = false;
    let lastActive = "";
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const reduce = reducedMotion();
      const beat = document.documentElement.dataset.lwBeat ?? "";
      const onPillars = PILLAR_KEYS.has(beat);
      const atContact = beat === "contact";

      // Where the droplet should be, relative to the pill.
      const pillBox = pill.getBoundingClientRect();
      let tl: number;
      let tr: number;
      if (atContact) {
        const box = cta.getBoundingClientRect();
        const c = box.left - pillBox.left + box.width / 2;
        tl = c - 5;
        tr = c + 5;
      } else {
        const box = services.getBoundingClientRect();
        tl = box.left - pillBox.left + 4;
        tr = box.right - pillBox.left - 4;
      }
      if (!placed || reduce || opacity < 0.01) {
        left.x = tl;
        right.x = tr;
        left.v = right.v = 0;
        placed = true;
      } else {
        const goingRight = (tl + tr) / 2 > (left.x + right.x) / 2;
        stepSpring(goingRight ? right : left, goingRight ? tr : tl, fast, dt);
        stepSpring(goingRight ? left : right, goingRight ? tl : tr, slow, dt);
      }
      const centre = (left.x + right.x) / 2;
      const arrived = atContact && Math.abs(centre - (tl + tr) / 2) < 8;
      if (!atContact) poured = false;
      else if (arrived) poured = true;

      // Visible over the pillars, and on its way to "Let's talk" until it pours in.
      const want = onPillars || (atContact && !poured) ? 1 : 0;
      opacity = reduce ? want : damp(opacity, want, 12, dt);

      const fillTarget = atContact && poured ? 1 : 0;
      if (reduce) {
        fill = fillTarget;
        fillV = 0;
      } else {
        fillV +=
          (fillSpring.k * (fillTarget - fill) - fillSpring.c * fillV) * dt;
        fill = Math.min(1.08, Math.max(0, fill + fillV * dt));
      }

      const max =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      progress = reduce ? p : damp(progress, p, 14, dt);

      // Writes. A stretched drop gets thinner, like a real one.
      const width = Math.max(6, right.x - left.x);
      const rest = Math.max(6, tr - tl);
      const thin = 1 - 0.4 * Math.min(1, Math.max(0, width / rest - 1));
      drop.style.width = `${width}px`;
      drop.style.transform = `translate3d(${left.x}px, 0, 0) scaleY(${thin})`;
      drop.style.opacity = String(opacity);
      cta.style.setProperty("--fill", fill.toFixed(4));
      cta.dataset.full = fill > 0.55 ? "1" : "0";
      pill.style.setProperty("--progress", progress.toFixed(4));
      const active = atContact ? "contact" : onPillars ? "services" : "";
      if (active !== lastActive) {
        services.dataset.active = active === "services" ? "1" : "0";
        cta.dataset.active = active === "contact" ? "1" : "0";
        lastActive = active;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // The phone menu: scroll lock, Escape, focus. Round 13 ("background drop elements are a
  // bit too much, a simple blur might do the trick"): no more flood; the menu is a frosted
  // backdrop (workshop.css), and html[data-lw-menu] holds the page still.
  useEffect(() => {
    const html = document.documentElement;
    if (!open) return;
    html.dataset.lwMenu = "1";
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    firstMenuLinkRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => {
      if (wide.matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    const button = menuButtonRef.current;
    return () => {
      delete html.dataset.lwMenu;
      html.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      button?.focus();
    };
  }, [open]);

  /** Story links: close the menu first (it locks scrolling), then scroll. */
  const goTo = useCallback(
    (key: string, fallback: string) => (event: React.MouseEvent) => {
      event.preventDefault();
      setOpen(false);
      window.setTimeout(() => scrollToBeat(key, fallback), 60);
    },
    [],
  );
  const close = useCallback(() => setOpen(false), []);

  return (
    <nav data-lw-nav="" aria-label="Main" className="lw-nav">
      <div ref={pillRef} className="lw-nav-pill">
        <Link href="/" className="lw-brand" onClick={close}>
          <span className="lw-brand-drop" aria-hidden="true" />
          team random
        </Link>

        <div className="lw-nav-links">
          <Link href="/works" className="lw-nav-link">
            Work
          </Link>
          <a
            ref={servicesRef}
            href="#services"
            className="lw-nav-link"
            onClick={goTo(PILLARS[0].key, "#services")}
          >
            Services
          </a>
          <Link href="/about" className="lw-nav-link">
            About
          </Link>
        </div>
        <span ref={dropRef} className="lw-nav-drop" aria-hidden="true" />

        <a
          ref={ctaRef}
          href="#cta"
          className="lw-cta"
          onClick={goTo("contact", "#cta")}
        >
          <span className="lw-cta-fill" aria-hidden="true" />
          <span className="lw-cta-label">Let’s talk</span>
        </a>

        <button
          ref={menuButtonRef}
          type="button"
          className="lw-menu-button"
          aria-expanded={open}
          aria-controls="lw-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>

        <span className="lw-nav-progress" aria-hidden="true">
          <span className="lw-nav-progress-fill" />
          <span className="lw-nav-progress-head" />
        </span>
      </div>

      {/* Always mounted (round 13), so it can fade out too; hidden (and so neither focusable
          nor read out) while closed. */}
      <div id="lw-menu" className="lw-menu" data-open={open ? "1" : "0"}>
        {/* Tapping anywhere off the links closes it (Escape and Close work too). */}
        <button
          type="button"
          className="lw-menu-backdrop"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={close}
        />
        <ul>
          <li style={{ "--i": 0 } as React.CSSProperties}>
            <Link ref={firstMenuLinkRef} href="/works" onClick={close}>
              Work
            </Link>
          </li>
          <li style={{ "--i": 1 } as React.CSSProperties}>
            <a href="#services" onClick={goTo(PILLARS[0].key, "#services")}>
              Services
            </a>
          </li>
          <li style={{ "--i": 2 } as React.CSSProperties}>
            <Link href="/about" onClick={close}>
              About
            </Link>
          </li>
          <li style={{ "--i": 3 } as React.CSSProperties}>
            <a href="#cta" onClick={goTo("contact", "#cta")}>
              Let’s talk
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
