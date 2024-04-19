import { HeroWavy } from "@/components/HeroWavy";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { LampDemo } from "@/components/ui/lamp";
import { permanentMarker, pixelify } from "@/app/fonts";
import Parallax from "@/components/Parallax";
import { Globe, Palette, PanelsTopLeft, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col w-full  animate-fadeIn">
      <section
        id="hero"
        className="w-full flex h-screen items-center justify-center"
      >
        <HeroWavy
          header={"Coding your digital future"}
          span={"one pixel at a time"}
        />
      </section>
      {/* <TracingBeam> */}
      <section
        id="about"
        className="w-full flex flex-col min-h-screen justify-start items-start"
      >
        <div className="w-fit h-fit">
          {/* <h2 className={`${permanentMarker.className} text-3xl sm:text-4xl md:text-6xl dark:text-primary font-bold`}>
              This is about section(kinda){" "}
              <span className={`${pixelify.className}`}>pixel by pixel</span>
            </h2> */}
          <LampDemo />
        </div>
      </section>
      <section
        id="services"
        className="w-full  flex h-screen flex-col items-center justify-center"
      >
        {/* <div className="w-fit h-fit flex flex-wrap flex-col justify-start items-center p-4"></div> */}
        <div className="md:h-[50rem] min-h-fit w-full bg-background dark:bg-grid-white/[0.2] bg-grid-black/[0.2] relative flex items-center justify-center">
          {/* Radial gradient for the container to give a faded look */}
          <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] "></div>
          <Parallax>
            <div className="font-bold relative z-20 bg-clip-text bg-gradient-to-b from-neutral-200 to-neutral-500 py-8 px-8 md:px-8 lg:px-20 xl:px-32  gap-10 md:gap-20 w-full flex flex-col items-center">
              <div className="flex flex-col md:flex-row gap-10 md:gap-20 text-black dark:text-white justify-center w-full  items-center md:items-start">
                <h2
                  className={`${permanentMarker.className} text-[#ea580c] text-6xl sm:text-7xl md:text-7xl lg:text-8xl `}
                >
                  Our <br /> Services.
                </h2>
                <div className="max-w-xs flex flex-col gap-2 md:gap-4 justify-center h-full text-center md:text-start">
                  <h3 className="text-lg md:text-xl lg:text-3xl  font-semibold ">
                    An overview of what we do.
                  </h3>
                  <p className="sm:text-sm md:text-md dark:text-[#ffffff31] font-normal">
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Commodi consequuntur modi est maxime? Optio, maiores.
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-10 md:gap-20 p-6 md:p-10 dark:bg-black bg-white rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm dark:bg-opacity-50 bg-opacity-10 w-fit  text-center md:text-start">
                <div className="flex flex-col gap-2 max-w-[400px] md:max-w-[200px] items-center md:items-start w-full">
                  <Palette className="md:w-8 md:h-8 w-8 h-8" />
                  <h4 className="font-bold dark:text-white sm:text-sm md:text-lg">
                    Web Design
                  </h4>
                  <p className=" px-4 sm:px-12 md:px-0 z-20 dark:text-[#ffffff75] font-normal text-xs md:text-sm">
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Consectetur illo recusandae!
                  </p>
                </div>
                <div className="flex flex-col gap-2 max-w-[400px] md:max-w-[200px] items-center md:items-start w-full">
                  <PanelsTopLeft className="md:w-8 md:h-8 w-8 h-8" />
                  <h4 className="font-bold dark:text-white sm:text-sm md:text-lg">
                    Web Development
                  </h4>
                  <p className=" px-4 sm:px-12 md:px-0 z-20 dark:text-[#ffffff75] font-normal text-xs md:text-sm">
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Consectetur illo recusandae!
                  </p>
                </div>
                <div className="flex flex-col gap-2 max-w-[400px] md:max-w-[200px] items-center md:items-start w-full">
                  <Users className="md:w-8 md:h-8 w-8 h-8" />
                  <h4 className="font-bold dark:text-white sm:text-sm md:text-lg">
                    CRM Platforms
                  </h4>
                  <p className=" px-4 sm:px-12 md:px-0 z-20 dark:text-[#ffffff75] font-normal text-xs md:text-sm">
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Consectetur illo recusandae!
                  </p>
                </div>
              </div>
            </div>
          </Parallax>
        </div>
      </section>
      <section
        id="cta"
        className="w-full flex h-screen items-center justify-center"
      >
        <div className="w-fit h-fit flex flex-wrap flex-col justify-start items-center p-4">
          <h2
            className={`${permanentMarker.className} text-3xl sm:text-4xl md:text-6xl dark:text-primary font-bold`}
          >
            This is cta{" "}
            <span className={`${pixelify.className}`}>pixel by pixel</span>
          </h2>
        </div>
      </section>
      {/* </TracingBeam> */}
    </main>
  );
}
