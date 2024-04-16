import ContactForm from "@/components/forms/ContactForm";
import React from "react";

function Page() {
  return (
    <div className="flex flex-col w-full pt-[72px] animate-fadeIn p-4  lg:px-32">
      <ContactForm />
    </div>
  );
}

export default Page;