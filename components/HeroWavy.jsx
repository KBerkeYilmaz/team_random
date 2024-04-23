"use client";
import React, { useEffect, useState } from "react";
import { WavyBackground } from "@/components/ui/wavy-background";
import { permanentMarker, pixelify } from "@/app/fonts";
import { motion } from "framer-motion";
import { TypewriterEffect } from "./ui/typewriter-effect";

export function HeroWavy({ header, span }) {
  const [darkMode, setDarkMode] = useState(false);
  const wordsData = span.split(" ").map((word) => ({ text: word }));

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
      className="mx-auto max-w-4xl "
      backgroundFill={darkMode ? "#000" : "#8dde7d"}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: "easeInOut",
        }}
      >
        <h1
          className={`${permanentMarker.className} text-center text-4xl font-bold tracking-wider dark:text-primary sm:text-6xl md:text-7xl lg:text-9xl`}
        >
          {header}
        </h1>
        <TypewriterEffect
          words={wordsData}
          className={`${pixelify.className} mt-4 text-center text-3xl text-foreground sm:text-4xl md:text-5xl lg:text-6xl`}
        />
      </motion.div>
    </WavyBackground>
  );
}
