"use server";
import { Loader2 } from "lucide-react";
import { fetchInbox } from "@/actions/emailAction";
import { Separator } from "@/components/ui/separator";

async function page() {
  const data = await fetchInbox();
  if (!data) {
    return (
      <div className="flex w-full justify-center mt-10">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }
  return (
    <div className="h-full w-full p-10 animate-fadeIn">
      <h1 className="text-4xl font-semibold">Inbox</h1>
      <Separator className="my-4" />
      <ul className="flex flex-col gap-4 py-4 w-full">
        {data.map((email, index) => (
          <li
            key={index}
          >
            <span>{email.uid}</span>
            <h3>{email.subject}</h3>
            <p>{email.date}</p>
            <p>{email.from}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default page;
