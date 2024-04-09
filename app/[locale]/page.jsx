import { HeroWavy } from "@/components/HeroWavy";
import { TracingBeam } from "@/components/ui/tracing-beam";

export default function Home() {
  return (
    <main className="flex flex-col w-full animate-fadeIn">
      <section
        id="hero"
        className="w-full flex h-screen  items-center justify-center"
      >
        <HeroWavy
          header={"Coding your digital future"}
          span={"one pixel at a time"}
        />
      </section>
      <TracingBeam>
        <section
          id="about"
          className="w-full flex h-screen  items-center justify-center"
        >
          <div className="w-fit h-fit flex flex-wrap flex-col justify-start items-center p-4">
            <h2 className="permanent-marker-bold text-3xl sm:text-4xl md:text-6xl dark:text-orange-500">
              This is about section(kinda){" "}
              <span className="pixelify-header-bold">pixel by pixel</span>
            </h2>
          </div>
        </section>
        <section
          id="services"
          className="w-full flex h-screen  items-center justify-center"
        >
          <div className="w-fit h-fit flex flex-wrap flex-col justify-start items-center p-4">
            <h2 className="permanent-marker-bold text-3xl sm:text-4xl md:text-6xl dark:text-orange-500">
              This is services section{" "}
              <span className="pixelify-header-bold">pixel by pixel</span>
            </h2>
          </div>
        </section>
        <section
          id="cta"
          className="w-full flex h-screen items-center justify-center"
        >
          <div className="w-fit h-fit flex flex-wrap flex-col justify-start items-center p-4">
            <h2 className="permanent-marker-bold text-3xl sm:text-4xl md:text-6xl dark:text-orange-500">
              This is cta{" "}
              <span className="pixelify-header-bold">pixel by pixel</span>
            </h2>
          </div>
        </section>
      </TracingBeam>
    </main>
  );
}
