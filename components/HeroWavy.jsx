"use client";
import React, { useEffect, useState } from "react";
import { WavyBackground } from "@/components/ui/wavy-background";

export function HeroWavy({ header, span }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const updateDarkMode = () => {
      // Correctly checks if the 'dark' class is present and updates darkMode state
      const htmlClassList = document.documentElement.classList;
      setDarkMode(htmlClassList.contains("dark"));
    };

    const observer = new MutationObserver(updateDarkMode);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    updateDarkMode(); // Initial check

    return () => observer.disconnect();
  }, []);

  return (
    <WavyBackground
      className="max-w-4xl mx-auto "
      backgroundFill={darkMode ? "#0c0a09" : "#f6f7fe"}
    >
      <h1 className="permanent-marker-bold text-4xl sm:text-6xl md:text-7xl lg:text-9xl dark:text-orange-500 text-center">
        {header}
      </h1>
      <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mt-4 text-foreground font-normal pixelify-header-bold text-center">
        {span}
      </p>
    </WavyBackground>
  );
}
