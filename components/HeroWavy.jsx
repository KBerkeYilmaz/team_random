"use client";
import React from "react";
import { WavyBackground } from "@/components/ui/wavy-background";

export function HeroWavy({header, span}) {
  return (
    <WavyBackground className="max-w-4xl mx-auto pb-40" backgroundFill={"#0c0a09"}>
      <h1 className="permanent-marker-bold text-4xl sm:text-6xl md:text-7xl lg:text-9xl dark:text-orange-500 text-center">
        {header}
      </h1>
      <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mt-4 text-foreground font-normal pixelify-header-bold text-center">
        {span}
      </p>
    </WavyBackground>
  );
}
