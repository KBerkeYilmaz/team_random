"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui/button";

export const SignOutButton = () => {
  const handleSignOut = () => {
    signOut({ callbackUrl: "https://localhost:3000" });
  };

  return <Button onClick={handleSignOut}>Sign Out</Button>;
};
