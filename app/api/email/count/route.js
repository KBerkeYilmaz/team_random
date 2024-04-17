import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";

export async function GET(req) {
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
