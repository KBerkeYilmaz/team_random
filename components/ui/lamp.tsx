"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SparklesCore } from "./sparkles";

export function LampDemo() {
  return (
    <LampContainer>
      <motion.h2
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="mt-4 bg-gradient-to-br from-orange-400/90 to-orange-600 bg-clip-text py-4 text-center text-4xl font-medium tracking-tight text-transparent dark:from-slate-300 dark:to-slate-500 md:text-7xl"
      >
        Build your app <br /> the right way
      </motion.h2>
    </LampContainer>
  );
}

export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative z-0 flex min-h-screen flex-col items-center justify-start overflow-hidden rounded-md bg-background md:w-full",
        className,
      )}
    >
      <div className="relative isolate z-0 flex w-full flex-1 scale-y-125 items-center justify-center ">
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="bg-gradient-conic absolute inset-auto right-1/2 h-56 w-[30rem] overflow-visible from-blue-500 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top] dark:from-orange-500 dark:via-transparent dark:to-transparent"
        >
          <div className="absolute  bottom-0 left-0 z-20 h-40 w-[100%] bg-background [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute  bottom-0 left-0 z-20 h-[100%] w-40  bg-background bg-opacity-5 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="bg-gradient-conic absolute inset-auto left-1/2 h-56 w-[30rem] from-transparent via-transparent to-blue-500 text-white [--conic-position:from_290deg_at_center_top] dark:to-orange-500"
        >
          <div className="absolute  bottom-0 right-0 z-20 h-[100%]  w-40 bg-background [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute  bottom-0 right-0 z-20 h-40 w-[100%] bg-background [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-background blur-2xl"></div>
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-blue-500 opacity-50 blur-3xl dark:bg-orange-500"></div>
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-blue-400 blur-2xl dark:bg-orange-400"
        ></motion.div>

        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-blue-400 dark:bg-orange-400 "
        ></motion.div>
        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-background "></div>
        <motion.div
          className="relative h-40 w-full md:w-[44rem]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{
            delay: 0.8,
            duration: 1,
            ease: "easeInOut",
          }}
        >
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={1000}
            className="h-full w-full"
            particleColor="#FFFFFF"
          />
        </motion.div>
      </div>

      <div className="relative z-50 flex -translate-y-80 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
};
