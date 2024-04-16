import { HeroWavy } from "@/components/HeroWavy";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { LampDemo } from "@/components/ui/lamp";
import { permanentMarker, pixelify } from "@/app/fonts";

export default function Home() {
  return (
    <main className="flex flex-col w-full animate-fadeIn">
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
          {/* <h2 className={`${permanentMarker.className} text-3xl sm:text-4xl md:text-6xl dark:text-orange-500 font-bold`}>
              This is about section(kinda){" "}
              <span className={`${pixelify.className}`}>pixel by pixel</span>
            </h2> */}
          <LampDemo />
        </div>
      </section>
      <section
        id="services"
        className="w-full flex h-screen flex-col items-center justify-center"
      >
        <div className="w-fit h-fit flex flex-wrap flex-col justify-start items-center p-4"></div>
        <div className="h-[50rem] w-full bg-background dark:bg-grid-white/[0.2] bg-grid-black/[0.2] relative flex items-center justify-center">
          {/* Radial gradient for the container to give a faded look */}
          <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
          <div className="text-3xl sm:text-4xl md:text-6xl font-bold relative z-20 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500 py-8">
            <h2
              className={`${permanentMarker.className} text-center dark:text-orange-500`}
            >
              This is services section <br />
              <span className={`${pixelify.className}`}>pixel by pixel</span>
            </h2>
          </div>
        </div>
      </section>
      <section
        id="cta"
        className="w-full flex h-screen items-center justify-center"
      >
        <div className="w-fit h-fit flex flex-wrap flex-col justify-start items-center p-4">
          <h2
            className={`${permanentMarker.className} text-3xl sm:text-4xl md:text-6xl dark:text-orange-500 font-bold`}
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
