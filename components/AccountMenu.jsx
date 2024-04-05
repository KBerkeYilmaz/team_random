"use client";
import { CircleUser } from "lucide-react";
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "./SignOutButton";

export default function AccountMenu({ user }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          {user.image === undefined ? (
            <CircleUser className="h-5 w-5" />
          ) : (
            <Image
              src={user.image}
              width={40}
              height={40}
              alt="Picture of the author"
            />
          )}

          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="w-full flex justify-center">
          My Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="w-full flex justify-center"
          onClick={() => router.push("/dashboard/account")}
        >
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem className="w-full flex justify-center">
          Support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <SignOutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
