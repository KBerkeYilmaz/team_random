"use client";

import { signOut } from "next-auth/react";

const Dashboard = () => {  
  const handleSignOut = () => {
    signOut({ callbackUrl: "https://localhost:3000" });
  };

  return (
    <div className="flex flex-col justify-center items-center text-black w-screen h-screen">
      <h1>Welcome to dashboard</h1>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
};

export default Dashboard;
