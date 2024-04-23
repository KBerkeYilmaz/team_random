"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname.includes("/dashboard")) {
    return null;
  }

  return (
    <footer className="h-fit w-screen">
      <div className="flex h-full w-full items-center justify-center bg-background p-20">
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-center text-sm font-semibold ">
            Team Random &copy; 2024. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
