"use client";
import { useRouter, usePathname } from "../navigation.js";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "next-intl";

function LangSwitch() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const pathname = usePathname();

  const t = useTranslations("LangSwitch");

  const handleClose = (event) => {
    console.log(event.target.value);
    const nextLocale = event.target.value;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const languages = [
    {
      value: "en",
      label: "EN",
    },
    {
      value: "tr",
      label: "TR",
    },
  ];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-fit justify-between"
        >
          {t("title")}
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
          {languages.map((lang, i) => {
            return (
              <Button
                key={i}
                className="font-normal"
                onClick={handleClose}
                value={lang.value}
                variant="ghost"
              >
                {lang.label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
export default LangSwitch;
