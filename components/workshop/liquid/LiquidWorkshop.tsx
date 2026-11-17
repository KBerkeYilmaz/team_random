"use client";
// PROTOTYPE, never merge (throwaway branch). Plan in one line: liquid-particle backgrounds
// on the real landing route, switchable via ?variant=form|cascade|cup|stream|drip|off
// (form, the cascade pouring itself into section silhouettes, is the default), tuned live
// in a Tweakpane panel, dark + light.
//
// URL flags: ?hud=0 hides the chrome (also the H key), ?lwq=desktop|mobile|low pins the
// quality tier, ?lwfallback=1 forces the no-WebGL fallback.
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { VariantSwitcher } from "../VariantSwitcher";

// Lenis' own rules (round 10: the engine smooths the page's scroll; see engine/smooth.ts).
import "lenis/dist/lenis.css";
import "./workshop.css";
import PillarCopy from "./PillarCopy";
import { WORKSHOP_VARIANTS, parseTier, parseVariant } from "./variants";
import WorkshopNav from "./WorkshopNav";

const LiquidCanvas = dynamic(() => import("./LiquidCanvas"), { ssr: false });

export default function LiquidWorkshop() {
  return (
    <Suspense fallback={null}>
      <Workshop />
    </Suspense>
  );
}

function Workshop() {
  const searchParams = useSearchParams();
  const variant = parseVariant(searchParams.get("variant"));
  const hud = searchParams.get("hud") !== "0";
  const tier = parseTier(searchParams.get("lwq"));
  const forceFallback = searchParams.get("lwfallback") === "1";

  useEffect(() => {
    const html = document.documentElement;
    if (variant === "off") return;
    html.dataset.liquidWorkshop = "1";
    return () => {
      delete html.dataset.liquidWorkshop;
    };
  }, [variant]);

  useEffect(() => {
    const html = document.documentElement;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "h" && event.key !== "H") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, [contenteditable], [data-lw-panel]",
        )
      )
        return;
      html.dataset.lwHud = html.dataset.lwHud === "off" ? "on" : "off";
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      delete html.dataset.lwHud;
    };
  }, []);

  return (
    <>
      {variant !== "off" && (
        <>
          {/* Round 9: the glass pill nav and the pillars' copy (driven by the form story). */}
          <WorkshopNav />
          <PillarCopy />
        </>
      )}
      {variant !== "off" && (
        <LiquidCanvas
          variant={variant}
          tier={tier}
          hud={hud}
          forceFallback={forceFallback}
        />
      )}
      {hud && <VariantSwitcher options={WORKSHOP_VARIANTS} current={variant} />}
    </>
  );
}
