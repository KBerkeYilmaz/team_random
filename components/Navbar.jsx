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

export const Navbar = () => {
  return (
    <div className="flex items-center fixed w-full justify-between px-8 py-4 bg-white dark:bg-gray-800 shadow-md">
      <Link className="flex items-center gap-2" href="/">
        <span className="text-lg font-semibold">LOGO</span>
      </Link>
      <div className="hidden md:flex gap-4">
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
          href="/contact"
        >
          Contact Us
        </Link>
        <Link
          className="text-lg hover:text-foreground/40 transition-all duration-200"
          href="/login"
        >
          Login
        </Link>
      </div>
      <div className="hidden lg:flex gap-4">
        <LangSwitch />
        <ModeToggle />
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button className="lg:hidden" size="icon" variant="outline">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <div className="flex justify-between mt-6 px-2">
            <Link className="flex items-center gap-2" href="/">
              <span className="text-lg font-semibold">LOGO</span>
            </Link>
            <div className="flex gap-4">
              <LangSwitch />
              <ModeToggle />
            </div>
          </div>
          <div className="grid w-[200px] p-4">
            <Link
              className="text-lg hover:text-foreground/40 transition-all duration-200"
              href="/"
            >
              <SheetClose>Home</SheetClose>
            </Link>
            <Link
              className="text-lg hover:text-foreground/40 transition-all duration-200"
              href="/about"
            >
              <SheetClose>About</SheetClose>
            </Link>
            <Link
              className="text-lg hover:text-foreground/40 transition-all duration-200"
              href="/works"
            >
              <SheetClose>Works</SheetClose>
            </Link>
            <Link
              className="text-lg hover:text-foreground/40 transition-all duration-200"
              href="/contact"
            >
              <SheetClose>Contact Us</SheetClose>
            </Link>
            <Link
              className="text-lg hover:text-foreground/40 transition-all duration-200"
              href="/login"
            >
              <SheetClose>Login</SheetClose>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
