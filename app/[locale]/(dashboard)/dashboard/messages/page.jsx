import { cookies } from "next/headers";
import { Loader2 } from "lucide-react";
import { fetchInbox } from "@/actions/emailAction";
import { Separator } from "@/components/ui/separator";
import { Mail } from "@/components/ui/mail/mail";
import {
  accounts,
  mails,
} from "@/app/[locale]/(dashboard)/dashboard/messages/data";

async function page() {
  // const data = await fetchInbox();
  if (!mails.length) {
    return (
      <div className="flex w-full justify-center mt-10">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  const layoutCookie = cookies().get("react-resizable-panels:layout");
  const collapsedCookie = cookies().get("react-resizable-panels:collapsed");

  const defaultLayout = layoutCookie
    ? JSON.parse(layoutCookie.value || "null")
    : undefined;
  const defaultCollapsed = collapsedCookie
    ? JSON.parse(collapsedCookie.value || "false")
    : false;

  return (
    <div className="h-full w-full p-10 animate-fadeIn">
      {/* <ul className="flex flex-col gap-4 py-4 w-full">
        {data.map((email, index) => (
          <li key={index}>
            <span>{email.uid}</span>
            <h3>{email.subject}</h3>
            <p>{email.date}</p>
            <p>{email.from}</p>
            <p>{email.body}</p>
          </li>
        ))}
      </ul> */}
      <div className="hidden flex-col md:flex">
        <Mail
          accounts={accounts}
          // mails={mails}
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          navCollapsedSize={4}
        />
      </div>
    </div>
  );
}

export default page;
