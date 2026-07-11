"use client";
import { Loader2 } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { useState } from "react";
import { useRouter } from "@/navigation";
import { useToast } from "./ui/use-toast";

export const SignOutButton = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // AUDIT #87 (Phase 1): Better Auth's signOut() takes no callbackUrl — clear the
  // session, then redirect manually (locale-aware) to the home page.
  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    toast({
      title: "Sign Out Successful !",
      description: "- Redirecting to Home",
    });
    router.push("/");
  };
  return (
    <>
      {!isSigningOut ? (
        <Button
          className="w-full hover:bg-destructive"
          style={{ gridRow: "85" }}
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      ) : (
        <Button className="w-full" style={{ gridRow: "85" }} disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait
        </Button>
      )}
    </>
  );
};
