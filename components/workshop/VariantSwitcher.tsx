"use client";
// PROTOTYPE, never merge. Shared floating switcher for UI prototypes (prototype skill):
// a bottom-centre pill with prev/next arrows that rewrites `?variant=`. Arrow keys work
// too, unless focus is in a field or in the workshop panel.
//
// Uses window.history.replaceState (Next 14.1+ keeps useSearchParams in sync with it):
// no RSC round-trip, no remount, no scroll jump. Deliberately NOT `@/navigation`, whose
// localePrefix differs from the middleware's and would bounce through /en.
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export interface SwitcherOption {
  key: string;
  label: string;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target.closest("input, textarea, select, [data-lw-panel]")) return true;
  return false;
}

export function VariantSwitcher({
  options,
  current,
  param = "variant",
}: {
  options: readonly SwitcherOption[];
  current: string;
  param?: string;
}) {
  const searchParams = useSearchParams();

  const go = useCallback(
    (dir: 1 | -1) => {
      const index = Math.max(
        0,
        options.findIndex((o) => o.key === current),
      );
      const next = options[(index + dir + options.length) % options.length];
      const params = new URLSearchParams(searchParams.toString());
      params.set(param, next.key);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`,
      );
    },
    [options, current, param, searchParams],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (process.env.NODE_ENV === "production") return null;

  const active = options.find((o) => o.key === current) ?? options[0];

  return (
    <div
      role="group"
      aria-label="Prototype variant switcher"
      className="lw-hud fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-950/90 p-1.5 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/15 backdrop-blur"
    >
      <button
        type="button"
        aria-label="Previous variant"
        onClick={() => go(-1)}
        className="grid h-9 w-9 place-items-center rounded-full text-lg transition-transform hover:bg-white/10 active:scale-95"
      >
        ‹
      </button>
      <span
        className="min-w-[15rem] px-2 text-center text-sm font-medium"
        aria-live="polite"
      >
        <span className="text-orange-400">{active.key}</span>
        <span className="text-white/60">: {active.label}</span>
      </span>
      <button
        type="button"
        aria-label="Next variant"
        onClick={() => go(1)}
        className="grid h-9 w-9 place-items-center rounded-full text-lg transition-transform hover:bg-white/10 active:scale-95"
      >
        ›
      </button>
    </div>
  );
}
