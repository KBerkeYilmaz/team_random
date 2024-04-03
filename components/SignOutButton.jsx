"use client";
import { Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { useState } from "react";
import { useToast } from "./ui/use-toast";

export const SignOutButton = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toast } = useToast();

  const handleSignOut = () => {
    setIsSigningOut(true);
    signOut({ callbackUrl: "https://localhost:3000" });
    toast({
      title: "Sign Out Successful !",
      description: "- Redirecting to Home",
    });
  };
  return (
    <>
      {!isSigningOut ? (
        <Button onClick={handleSignOut}>Sign Out</Button>
      ) : (
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait
        </Button>
      )}
    </>
  );
};
