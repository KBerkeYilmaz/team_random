import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req) {
  // AUDIT #83 (issue #82): the unread-count endpoint was world-readable — it
  // connected to Gmail IMAP with no auth. Now admin-only.
  // AUDIT #87 (Phase 1): admin session now from Better Auth (auth.api.getSession).
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.APP_EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  try {
    await client.connect();

    // Select and lock a mailbox. Throws if mailbox does not exist
    let lock = await client.getMailboxLock("INBOX");
    // fetch latest message source
    // client.mailbox includes information about currently selected mailbox
    // "exists" value is also the largest sequence number available in the mailbox

    // list subjects for all messages
    // uid value is always included in FETCH response, envelope strings are in unicode.
    let status = await client.status("INBOX", { unseen: true });
    const unseenMails = status.unseen;
    lock.release();
    await client.logout();
    return NextResponse.json(unseenMails, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json({ error: `${err}` }, { status: 500 });
  }
}
