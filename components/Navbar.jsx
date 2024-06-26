"use client";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { permanentMarker } from "@/app/fonts";
import Image from "next/image";
import {
  SheetTrigger,
  SheetContent,
  Sheet,
  SheetClose,
} from "@/components/ui/sheet";
import { Link } from "@/navigation";
import { Home, Menu } from "lucide-react";
import LangSwitch from "./LangSwitch";
import { ModeToggle } from "./ModeToggle";
import { Separator } from "./ui/separator";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  const changeBackground = () => {
    if (window.scrollY >= 80) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", changeBackground);

    return () => {
      window.removeEventListener("scroll", changeBackground);
    };
  }, []);

  if (pathname.includes("/dashboard")) {
    return null;
  }

  return (
    <nav
      className={`fixed z-50 flex w-full items-center justify-center will-change-auto`}
    >
      <div
        className={`flex w-full  items-center justify-between bg-background px-8 py-4 shadow-lg transition-all duration-500 dark:bg-background dark:shadow-sm dark:shadow-foreground/20 md:grid-cols-3 ${
          isScrolled &&
          "mx-6 mt-6 rounded-[50px] opacity-90 backdrop-blur-sm lg:bg-transparent lg:shadow-none lg:backdrop-blur-none dark:lg:bg-transparent dark:lg:shadow-none dark:lg:backdrop-blur-none"
        }`}
      >
        <div className="relative flex grow items-center gap-2 transition-all">
          <Link href="/">
            {/* <Image
              src={"/images/logos/logodef.png"}
              width={100}
              height={50}
              alt="logo"
              className="absolute -bottom-14 -left-6 lg:left-0"
              priority="true"
            /> */}
            {/* <h2 className="text-3xl text-center dark:bg-white rounded-lg dark:text-black text-white bg-blue-500">
              {"<?/>"}
            </h2> */}
            {/* <span className="absolute -bottom-4 left-20 hidden text-base font-bold tracking-wider lg:block">
              TEAM RANDOM
            </span> */}
            <span className="font-bold text-sm sm:text-md">TEAM RANDOM</span>
          </Link>
        </div>
        <div
          className={`hidden 
          grow 
          animate-fadeIn 
          justify-center 
          gap-4 
          md:flex 
          ${permanentMarker.className} 
          relative 
          text-lg 
          lg:text-2xl 
          3xl:text-3xl
          transition-all
          duration-300
          delay-75
          `}
        >
          <Link
            className={`transition-all duration-200 hover:text-orange-500/90 dark:hover:text-primary/90 `}
            href="/"
          >
            Home
          </Link>
          <Link
            className={`w-fit transition-all duration-200 hover:text-orange-500/90 dark:hover:text-primary/90`}
            href="/about"
          >
            About Us
          </Link>
          {session ? (
            <Link
              className="animate-fadeIn transition-all duration-200 hover:text-orange-500/90 dark:hover:text-primary/90"
              href="/dashboard"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              className="animate-fadeIn transition-all duration-200 hover:text-orange-500/90 dark:hover:text-primary/90"
              href="/login"
            >
              Login
            </Link>
          )}
        </div>
        <div className="hidden grow justify-end gap-2 md:flex">
          <LangSwitch />
          <ModeToggle />
        </div>
        <div className="flex grow justify-end gap-2 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="lg:hidden" size="icon" variant="outline">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="mb-4 mt-6 flex justify-between px-2">
                <SheetClose asChild>
                  <Link className="flex items-center gap-2" href="/">
                    <Home />
                  </Link>
                </SheetClose>
                <div className="flex gap-4">
                  <LangSwitch />
                  <ModeToggle />
                </div>
              </div>
              {/* <Separator /> */}
              <div
                className={`grid w-full p-4  ${permanentMarker.className} text-3xl `}
              >
                <SheetClose asChild>
                  <Link
                    className="px-4 py-4  transition-all duration-200 hover:text-orange-500/90 dark:hover:text-primary/90"
                    href="/"
                  >
                    Home
                  </Link>
                </SheetClose>
                <Separator />
                <SheetClose asChild>
                  <Link
                    className="px-4 py-4  transition-all duration-200 hover:text-orange-500/90 dark:hover:text-primary/90"
                    href="/about"
                  >
                    About
                  </Link>
                </SheetClose>
                <Separator />

                {!session && (
                  <Link
                    className="px-4 py-4  transition-all duration-200 hover:text-orange-500/90 dark:hover:text-primary/90"
                    href="/login"
                  >
                    <SheetClose>Login</SheetClose>
                  </Link>
                )}
                {session && (
                  <Link
                    className="px-4 py-4  transition-all duration-200 hover:text-orange-500/90 dark:hover:text-primary/90"
                    href="/dashboard"
                  >
                    <SheetClose>Dashboard</SheetClose>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
