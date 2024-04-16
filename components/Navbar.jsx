"use client";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  SheetTrigger,
  SheetContent,
  Sheet,
  SheetClose,
} from "@/components/ui/sheet";
import { Link } from "@/navigation";
import { Menu } from "lucide-react";
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
    <div className={`flex items-center justify-center w-full fixed z-50`}>
      <div
        className={`grid grid-cols-2 md:grid-cols-3 dark:bg-background bg-background dark:shadow-foreground/20 dark:shadow-sm shadow-lg items-center w-full justify-between px-8 py-4 transition-all duration-500 ${
          isScrolled && "backdrop-blur-sm opacity-90 mt-6 mx-6 rounded-[50px]"
        }`}
      >
        <div className="flex items-center grow gap-2 transition-all relative">
          <Link href="/">
            <Image
              src={"/images/logos/logodef.png"}
              width={100}
              height={50}
              alt="logo"
              className="absolute -bottom-14 -left-6 lg:left-0"
            />
            <span className="font-bold text-base tracking-wider absolute hidden lg:block left-20 -bottom-4">
              TEAM RANDOM
            </span>
          </Link>
        </div>
        <div className="hidden md:flex grow gap-2 justify-center animate-fadeIn">
          <Link
            className="text-lg hover:text-foreground/40 transition-all duration-200"
            href="/"
          >
            Home
          </Link>
          <Link
            className="text-lg hover:text-foreground/40 transition-all duration-200"
            href="/about"
          >
            About
          </Link>
          <Link
            className="text-lg hover:text-foreground/40 transition-all duration-200"
            href="/works"
          >
            Works
          </Link>
          <Link
            className="text-lg hover:text-foreground/40 transition-all duration-200"
            href="/contac"
          >
            Contact
          </Link>
          {session ? (
            <Link
              className="text-lg hover:text-foreground/40 transition-all duration-200 animate-fadeIn"
              href="/dashboard"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              className="text-lg hover:text-foreground/40 transition-all duration-200 animate-fadeIn"
              href="/login"
            >
              Login
            </Link>
          )}
        </div>
        <div className="hidden lg:flex grow gap-2 justify-end">
          <LangSwitch />
          <ModeToggle />
        </div>
        <div className="lg:hidden flex grow gap-2 justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="lg:hidden" size="icon" variant="outline">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex justify-between mt-6 mb-4 px-2">
                <Link className="flex items-center gap-2" href="/">
                  <span className="text-lg font-semibold">LOGO</span>
                </Link>
                <div className="flex gap-4">
                  <LangSwitch />
                  <ModeToggle />
                </div>
              </div>
              {/* <Separator /> */}

              <div className="grid w-full p-4">
                <Link
                  className="text-lg hover:text-foreground/40 transition-all duration-200 py-4 px-4"
                  href="/"
                >
                  <SheetClose>Home</SheetClose>
                </Link>
                <Separator />
                <Link
                  className="text-lg hover:text-foreground/40 transition-all duration-200 py-4 px-4"
                  href="/about"
                >
                  <SheetClose>About</SheetClose>
                </Link>
                <Separator />
                <Link
                  className="text-lg hover:text-foreground/40 transition-all duration-200 py-4 px-4"
                  href="/works"
                >
                  <SheetClose>Works</SheetClose>
                </Link>
                <Separator />
                <Link
                  className="text-lg hover:text-foreground/40 transition-all duration-200 py-4 px-4"
                  href="/contact"
                >
                  <SheetClose>Contact</SheetClose>
                </Link>
                <Separator />

                {!session && (
                  <Link
                    className="text-lg hover:text-foreground/40 transition-all duration-200 py-4 px-4"
                    href="/login"
                  >
                    <SheetClose>Login</SheetClose>
                  </Link>
                )}
                {session && (
                  <Link
                    className="text-lg hover:text-foreground/40 transition-all duration-200 py-4 px-4"
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
    </div>
  );
};
