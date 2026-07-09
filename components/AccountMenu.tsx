"use client";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/lib/auth-client";

export default function AccountMenu() {
  const router = useRouter();
  const { data } = useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Avatar>
            {/* better-auth types `user.image` as `string | null | undefined`, but
                AvatarImage's `src` (an <img> attribute) accepts only
                `string | undefined`. Narrow away the possible `null` with a
                type-only assertion (no runtime change). */}
            <AvatarImage src={data?.user?.image as string | undefined} />
            {/* AUDIT #87 (Phase 1): guard nullish name/[0] — data is null until
                the Better Auth session resolves (useSession is async). */}
            <AvatarFallback>{data?.user?.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="w-full flex justify-center">
          My Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="w-full flex justify-center cursor-pointer"
          onClick={() => router.push("/dashboard/account")}
        >
          Settings
        </DropdownMenuItem>
        {/* <DropdownMenuItem className="w-full flex justify-center">
          Support
        </DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <SignOutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
