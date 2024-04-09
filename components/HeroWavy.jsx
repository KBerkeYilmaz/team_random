"use client";
import React from "react";
import { WavyBackground } from "@/components/ui/wavy-background";

export function HeroWavy({header, span}) {
  return (
    <WavyBackground className="max-w-4xl mx-auto pb-40">
      <h1 className="permanent-marker-bold text-3xl sm:text-4xl md:text-6xl dark:text-orange-500 text-center">
        {header}
      </h1>
      <p className="text-base md:text-6xl mt-4 text-white font-normal pixelify-header-bold text-center">
        {span}
      </p>
    </WavyBackground>
  );
}
