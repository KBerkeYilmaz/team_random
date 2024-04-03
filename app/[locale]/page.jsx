import Image from "next/image";
import LangSwitch from "../../components/LangSwitch";
import { Counter } from "@/components/Counter";
import { ModeToggle } from "@/components/ModeToggle";

export default function Home() {
  return (
    <main className="flex flex-col w-screen justify-start items-center">
      {/* <Counter /> */}
      <section id="hero" className="flex w-screen justify-center items-center min-h-screen">
      <div className="w-fit">
        <h1 className="poppins-bold text-6xl text-left text-pretty antialiased dark:text-orange-400 tracking-wider">
          Coding your digital future <br />
          <span className="pixelify-header-bold text-6xl">pixel by pixel</span>
        </h1>
      </div>
      </section>
      <section id="service" className="flex w-screen justify-center items-center min-h-screen">
      <div className="w-fit">
        <h1 className="poppins-bold text-6xl text-left text-pretty antialiased dark:text-orange-400 tracking-wider">
          This is our services <br />
          <span className="pixelify-header-bold text-6xl">pixel by pixel</span>
        </h1>
      </div>
      </section>
      <section id="about" className="flex w-screen justify-center items-center min-h-screen">
      <div className="w-fit">
        <h1 className="poppins-bold text-6xl text-left text-pretty antialiased dark:text-orange-400 tracking-wider">
          This is about (kinda) <br />
          <span className="pixelify-header-bold text-6xl">pixel by pixel</span>
        </h1>
      </div>
      </section>
      <section id="cta" className="flex w-screen justify-center items-center min-h-screen">
      <div className="w-fit">
        <h1 className="poppins-bold text-6xl text-left text-pretty antialiased dark:text-orange-400 tracking-wider">
          Call to action gives us money <br />
          <span className="pixelify-header-bold text-6xl">pixel by pixel</span>
        </h1>
      </div>
      </section>
    </main>
  );
}
