import { HeroWavy } from "@/components/HeroWavy";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { LampDemo } from "@/components/ui/lamp";
import { permanentMarker, pixelify } from "@/app/fonts";
import Parallax from "@/components/Parallax";
import { Globe, Palette, PanelsTopLeft, Users } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";

export default function Home() {
  return (
    <main className="flex w-full animate-fadeIn  flex-col">
      <section
        id="hero"
        className="flex h-screen w-full items-center justify-center"
      >
        <HeroWavy
          header={"Coding your digital future"}
          span={"one pixel at a time"}
        />
      </section>
      {/* <TracingBeam> */}
      <section
        id="about"
        className="flex min-h-screen w-full flex-col items-start justify-start"
      >
        <div className="h-fit w-fit">
          <LampDemo />
        </div>
      </section>
      <section
        id="services"
        className="flex  h-screen w-full flex-col items-center justify-center"
      >
        {/* <div className="w-fit h-fit flex flex-wrap flex-col justify-start items-center p-4"></div> */}
        <div className="relative flex min-h-fit w-full items-center justify-center bg-background bg-grid-black/[0.2] dark:bg-grid-white/[0.2] md:h-[50rem]">
          {/* Radial gradient for the container to give a faded look */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] "></div>
          <Parallax>
            <div className="relative z-20 flex w-full flex-col items-center gap-10 bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text px-8  py-8 font-bold md:gap-20 md:px-8 lg:px-20 xl:px-32">
              <div className="flex w-full flex-col items-center justify-center gap-10 text-black dark:text-white md:flex-row  md:items-start md:gap-20">
                <h2
                  className={`${permanentMarker.className} text-6xl text-[#ea580c] sm:text-7xl md:text-7xl lg:text-8xl `}
                >
                  Our <br /> Services.
                </h2>
                <div className="flex h-full max-w-xs flex-col justify-center gap-2 text-center md:gap-4 md:text-start">
                  <h3 className="text-lg font-semibold md:text-xl  lg:text-3xl ">
                    An overview of what we do.
                  </h3>
                  <p className="md:text-md font-normal dark:text-[#ffffff31] sm:text-sm">
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Commodi consequuntur modi est maxime? Optio, maiores.
                  </p>
                </div>
              </div>
              <div className="flex w-fit flex-col justify-center gap-10 rounded-md bg-white bg-opacity-10 bg-clip-padding p-6 text-center backdrop-blur-sm backdrop-filter dark:bg-black dark:bg-opacity-50 md:flex-row md:gap-20  md:p-10 md:text-start">
                <div className="flex w-full max-w-[400px] flex-col items-center gap-2 md:max-w-[200px] md:items-start">
                  <Palette className="h-8 w-8 md:h-8 md:w-8" />
                  <h4 className="font-bold dark:text-white sm:text-sm md:text-lg">
                    Web Design
                  </h4>
                  <p className=" z-20 px-4 text-xs font-normal dark:text-[#ffffff75] sm:px-12 md:px-0 md:text-sm">
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Consectetur illo recusandae!
                  </p>
                </div>
                <div className="flex w-full max-w-[400px] flex-col items-center gap-2 md:max-w-[200px] md:items-start">
                  <PanelsTopLeft className="h-8 w-8 md:h-8 md:w-8" />
                  <h4 className="font-bold dark:text-white sm:text-sm md:text-lg">
                    Web Development
                  </h4>
                  <p className=" z-20 px-4 text-xs font-normal dark:text-[#ffffff75] sm:px-12 md:px-0 md:text-sm">
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Consectetur illo recusandae!
                  </p>
                </div>
                <div className="flex w-full max-w-[400px] flex-col items-center gap-2 md:max-w-[200px] md:items-start">
                  <Users className="h-8 w-8 md:h-8 md:w-8" />
                  <h4 className="font-bold dark:text-white sm:text-sm md:text-lg">
                    CRM Platforms
                  </h4>
                  <p className=" z-20 px-4 text-xs font-normal dark:text-[#ffffff75] sm:px-12 md:px-0 md:text-sm">
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
        className="flex h-screen w-full items-center justify-center"
      >
        <div className="flex h-fit w-fit flex-col flex-wrap items-center justify-start p-4">
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
