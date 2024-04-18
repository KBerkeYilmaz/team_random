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
          {/* <h2 className={`${permanentMarker.className} text-3xl sm:text-4xl md:text-6xl dark:text-primary font-bold`}>
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
        {/* <div className="w-fit h-fit flex flex-wrap flex-col justify-start items-center p-4"></div> */}
        <div className="h-[50rem] w-full bg-background dark:bg-grid-white/[0.2] bg-grid-black/[0.2] relative flex items-center justify-center">
          {/* Radial gradient for the container to give a faded look */}
          <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] "></div>
          <div className="font-bold relative z-20 bg-clip-text bg-gradient-to-b from-neutral-200 to-neutral-500 py-8 px-32 gap-20 w-full flex flex-col items-center">
            <div className="flex gap-20 text-black dark:text-white justify-center w-full">
              <h2
                className={`${permanentMarker.className}  text-[#ea580c] text-3xl sm:text-4xl md:text-8xl max-w-md`}
              >
                Our Services.
              </h2>
              <div className="max-w-xs flex flex-col gap-4 justify-center">
                <h3 className="md:text-3xl font-semibold">
                  An overview of what we do.
                </h3>
                <p className="text-opacity-40 text-white font-normal">
                  Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                  Commodi consequuntur modi est maxime? Optio, maiores.
                </p>
              </div>
            </div>
            <div className="flex justify-center gap-24 p-10 bg-black  rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-50 w-fit ">
              <div className="flex flex-col gap-2 max-w-[200px]">
                <h4 className="font-bold text-white  text-lg">Web Design</h4>
                <p className="text-opacity-40 z-20 text-white font-normal text-sm">
                  Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                  Consectetur illo recusandae reprehenderit debitis libero
                  reiciendis!
                </p>
              </div>
              <div className="flex flex-col gap-2 max-w-[200px]">
                <h4 className="font-bold text-white  text-lg">
                  Web Development
                </h4>
                <p className="text-opacity-40 z-20 text-white  font-normal text-sm">
                  Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                  Consectetur illo recusandae reprehenderit debitis libero
                  reiciendis!
                </p>
              </div>
              <div className="flex flex-col gap-2 max-w-[200px]">
                <h4 className="font-bold text-white  text-lg">CRM Platforms</h4>
                <p className="text-opacity-40 z-20 text-white  font-normal text-sm">
                  Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                  Consectetur illo recusandae reprehenderit debitis libero
                  reiciendis!
                </p>
              </div>
            </div>
          </div>
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
