"use client";
// PROTOTYPE, never merge. Liquid Pour workshop: owns the engine's lifecycle. The heavy
// three.js engine is imported lazily after hydration, so the landing page's first paint
// and LCP (the hero headline) are untouched. Variant changes go to the live engine; they
// never rebuild the WebGL context.
import { useEffect, useRef, useState } from "react";

import type { Engine } from "./engine/engine";
import type { TierKey } from "./engine/params";
import LiquidFallback from "./LiquidFallback";
import type { WorkshopVariant } from "./variants";

export default function LiquidCanvas({
  variant,
  tier,
  hud,
  forceFallback,
}: {
  variant: Exclude<WorkshopVariant, "off">;
  tier: TierKey | null;
  hud: boolean;
  forceFallback: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const variantRef = useRef(variant);
  const [fallback, setFallback] = useState(forceFallback);

  useEffect(() => {
    variantRef.current = variant;
    engineRef.current?.setVariant(variant);
  }, [variant]);

  useEffect(() => {
    if (forceFallback) {
      setFallback(true);
      return;
    }
    setFallback(false);
    // `dead` guards the async import: under dev Strict Mode this effect mounts, unmounts
    // and mounts again, and a slow import must not create an engine after unmount.
    let dead = false;
    let engine: Engine | null = null;
    import("./engine/engine")
      .then(({ createEngine }) => {
        const host = hostRef.current;
        if (dead || !host) return;
        try {
          engine = createEngine({
            host,
            variant: variantRef.current,
            tier,
            hud,
            onFallback: () => {
              if (!dead) setFallback(true);
            },
          });
          engineRef.current = engine;
        } catch (err) {
          console.warn(
            "[liquid workshop] WebGL2 unavailable, showing the CSS fallback.",
            err,
          );
          setFallback(true);
        }
      })
      .catch((err: unknown) => {
        console.warn("[liquid workshop] engine failed to load.", err);
        if (!dead) setFallback(true);
      });
    return () => {
      dead = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, [forceFallback, tier, hud]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-lvh w-full overflow-hidden"
    >
      {fallback && <LiquidFallback />}
    </div>
  );
}
