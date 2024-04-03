"use client";
import { Button } from "@/components/ui/button";
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

  return (
    <div className={`flex items-center justify-center w-full fixed`}>
      <div
        className={`flex grow dark:bg-background bg-background dark:shadow-foreground/20 dark:shadow-sm shadow-lg items-center w-full justify-between px-8 py-4 transition-all duration-500 ${
          isScrolled && "backdrop-blur-sm opacity-90 mt-6 mx-6 rounded-[50px]"
        }`}
      >
        <div className="flex items-center grow gap-2 transition-all">
          <Link href="/">
            <span className="text-lg font-semibold">LOGO</span>
          </Link>
        </div>
        <div className="hidden md:flex grow gap-4 justify-center">
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
            href="/contactus"
          >
            Contact Us
          </Link>
          {!session && (
            <Link
              className="text-lg hover:text-foreground/40 transition-all duration-200 animate-fadeIn"
              href="/login"
            >
              Login
            </Link>
          )}
          {session && (
            <Link
              className="text-lg hover:text-foreground/40 transition-all duration-200 animate-fadeIn"
              href="/dashboard"
            >
              Dashboard
            </Link>
          )}
        </div>
        <div className="hidden lg:flex grow gap-4 justify-end">
          <LangSwitch />
          <ModeToggle />
        </div>
        <div className="lg:hidden flex grow gap-4 justify-end">
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
                  href="/contactus"
                >
                  <SheetClose>Contact Us</SheetClose>
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
