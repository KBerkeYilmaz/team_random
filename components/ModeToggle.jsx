"use client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ModeToggle() {
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="flex justify-center dark:hover:bg-background/30"
          variant="outline"
          size="icon"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:hidden" />
          <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 hidden transition-all dark:rotate-0 dark:block" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <div
          onClick={(currentValue) => {
            setValue(currentValue === value ? "" : currentValue);
            setOpen(false);
          }}
          className="p-1 flex flex-col"
        >
          <Button
            className="font-normal"
            onClick={() => setTheme("light")}
            variant="ghost"
          >
            Light
          </Button>
          <Button
            className="font-normal"
            onClick={() => setTheme("dark")}
            variant="ghost"
          >
            Dark
          </Button>
          <Button
            className="font-normal"
            onClick={() => setTheme("system")}
            variant="ghost"
          >
            System
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
