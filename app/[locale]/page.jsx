import Image from "next/image";
import LangSwitch from "../../components/LangSwitch";
import { Counter } from "@/components/Counter";
import { ModeToggle } from "@/components/ModeToggle";

export default function Home() {
  return (
    <main className="flex flex-col w-full pt-[72px] animate-fadeIn">
      <section
        id="hero"
        className="w-full flex h-screen  items-center justify-center"
      >
        <div className="w-fit h-fit">
          <h1 className="permanent-marker-bold text-6xl dark:text-orange-500">
            Coding your digital future <br />{" "}
            <span className="pixelify-header-bold">pixel by pixel</span>
          </h1>
        </div>
      </section>
      <section
        id="about"
        className="w-full flex h-screen  items-center justify-center"
      >
        <div className="w-fit h-fit">
          <h1 className="permanent-marker-bold text-6xl dark:text-orange-500">
            This is about section(kinda) <br />{" "}
            <span className="pixelify-header-bold">pixel by pixel</span>
          </h1>
        </div>
      </section>
      <section
        id="services"
        className="w-full flex h-screen  items-center justify-center"
      >
        <div className="w-fit h-fit">
          <h1 className="permanent-marker-bold text-6xl dark:text-orange-500">
            This is services section <br />{" "}
            <span className="pixelify-header-bold">pixel by pixel</span>
          </h1>
        </div>
      </section>
      <section
        id="cta"
        className="w-full flex h-screen items-center justify-center"
      >
        <div className="w-fit h-fit">
          <h1 className="permanent-marker-bold text-6xl dark:text-orange-500">
            This is cta <br />{" "}
            <span className="pixelify-header-bold">pixel by pixel</span>
          </h1>
        </div>
      </section>
    </main>
  );
}
