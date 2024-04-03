import Image from "next/image";
import LangSwitch from "../../components/LangSwitch";
import { Counter } from "@/components/Counter";
import { ModeToggle } from "@/components/ModeToggle";

export default function Home() {
  return (
    <main className="flex flex-col w-screen">
      <Counter />
    </main>
  );
}
