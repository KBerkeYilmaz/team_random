"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  Users2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MailDisplay } from "./mail-display";
import { MailList } from "./mail-list";
// import useMailStore from "@/stores/mailStore"
import { useMail } from "@/app/[locale]/(dashboard)/dashboard/inbox/use-mail";
import { fetchInbox } from "@/actions/emailAction";
import { type Mail as MailItem } from "@/app/[locale]/(dashboard)/dashboard/inbox/data";

export function Mail({
  defaultLayout = [265, 440, 655],
  defaultCollapsed = false,
}: {
  defaultLayout?: number[];
  defaultCollapsed?: boolean;
  // The inbox page also passes `accounts` and `navCollapsedSize`, which this
  // component ignores — accept them so the JSX usage type-checks.
  accounts?: unknown;
  navCollapsedSize?: number;
}) {
  const [mails, setMails] = useState<MailItem[]>([]); // State to hold the fetched mails
  const [loading, setLoading] = useState(true); // State to manage loading status

  useEffect(() => {
    async function loadMails() {
      try {
        const fetchedData = await fetchInbox(); // Assume this fetches raw email data
        console.log(fetchedData);
        // fetchInbox returns InboxEmail[] on success, or { props: { emails: [] } }
        // on failure — normalise to the array before mapping (behaviour-preserving:
        // the failure branch yields the empty list it always did).
        const list = Array.isArray(fetchedData)
          ? fetchedData
          : fetchedData.props.emails;
        const formattedMails = list.map((email) => ({
          id: email.uid, // Assumed to be unique identifier
          name: email.from, // Assumed 'from' is a string; might need parsing
          email: email.from, // Same as above, adjust if structure is different
          subject: email.subject,
          text: email.text, // Assuming body is plain text
          date: email.date, // Make sure date is in a compatible format
          read: !email.unseen, // Convert unseen to read; adjust logic as needed
          labels: ["work"], // Default to ["work"] or derive from email data
        }));
        // The fetched shape (numeric uid id, optional fields) doesn't match the
        // mock `Mail` type MailList/MailDisplay consume; the pre-Phase-3 code
        // already passed these through as-is, so cast to keep runtime identical.
        setMails(formattedMails as unknown as MailItem[]);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch emails:", error);
        setLoading(false);
      }
    }

    loadMails();
  }, []); // Dependency array left empty to only run once on mount

  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [mail] = useMail();

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            sizes,
          )}`;
        }}
        className="h-full max-h-fit items-stretch"
      >
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-4xl font-semibold">Inbox</h1>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="all"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  All mail
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Unread
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0">
              <MailList items={mails} />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <MailList items={mails.filter((item) => !item.read)} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={45}>
          <MailDisplay
            mail={mails.find((item) => item.id === mail.selected) || null}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
