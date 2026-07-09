import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { ImapFlow, type FetchQueryObject } from "imapflow";
import { revalidatePath } from "next/cache";
import { simpleParser } from "mailparser";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  // AUDIT #83: the contact form is public by design — only GET (the inbox read)
  // was locked down; POST stays unauthenticated intentionally.
  const { email, name, message } = await request.json();

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.APP_EMAIL,
      pass: env.APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: env.APP_EMAIL,
    to: env.APP_EMAIL,
    // cc: email, (uncomment this line if you want to send a copy to the sender)
    subject: `Message from ${name} (${email})`,
    text: message,
  };

  const sendMailPromise = () =>
    new Promise<string>((resolve, reject) => {
      transport.sendMail(mailOptions, function (err) {
        if (!err) {
          resolve("Email sent");
        } else {
          reject(err.message);
        }
      });
    });

  try {
    await sendMailPromise();
    return NextResponse.json({ message: "Email sent" });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // AUDIT #83 (issue #82): the inbox was world-readable — this handler connected
  // to Gmail IMAP with no auth check, so anyone could read the mailbox.
  // AUDIT #87 (Phase 1): admin session now from Better Auth (auth.api.getSession).
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = new ImapFlow({
    host: env.IMAP_HOST,
    port: env.IMAP_PORT,
    secure: true,
    auth: {
      user: env.APP_EMAIL,
      pass: env.APP_PASSWORD,
    },
  });
  let emailList = []; // Initialize an array to hold email data

  try {
    await client.connect();

    // Select and lock a mailbox. Throws if mailbox does not exist
    let lock = await client.getMailboxLock("INBOX");
    try {
      // fetch latest message source
      // client.mailbox includes information about currently selected mailbox
      // "exists" value is also the largest sequence number available in the mailbox
      // let message = await client.fetchOne(client.mailbox.exists, {
      //   source: true,
      // });
      //   console.log("latest message", message.source.toString());
      // let rawEmail = await client.fetchOne(client.mailbox.exists, {
      //   source: true,
      // });

      // // If rawEmail.source is a buffer, convert it to a string
      // const source = rawEmail.source.toString();

      // // Parse the email source to extract content
      // const parsedEmail = await simpleParser(source);
      // console.log("parsedEmail", parsedEmail.text);

      // list subjects for all messages
      // uid value is always included in FETCH response, envelope strings are in unicode.
      // console.log(`${message.uid}: ${message.envelope.subject}`);
      // FLAG (Phase 3 forced edit): this fetch query carries two pre-existing
      // options that imapflow's typed FetchQueryObject does not model — `seen:
      // false` (a search filter, not a fetch field) and `bodyParts: true` (the
      // type expects a string[] of part IDs). imapflow ignores both at runtime;
      // the object is passed verbatim (cast) so behaviour is byte-identical in
      // this type-only migration.
      const fetchQuery = {
        envelope: true,
        seen: false,
        bodyParts: true,
        bodyStructure: true,
        source: true,
      } as unknown as FetchQueryObject;
      for await (let message of client.fetch("1:*", fetchQuery)) {
        {
          // `source`/`envelope` are typed optional by imapflow, but we requested
          // both in the fetch above, so they are present at runtime — assert
          // non-null to preserve the exact prior access (and throw behaviour).
          const source = message.source!.toString();

          // Parse the email source to extract content
          const parsedEmail = await simpleParser(source);

          // Fetch the full raw message source
          emailList.push({
            // envelope: message.envelope,
            uid: message.uid,
            subject: message.envelope!.subject,
            date: message.envelope!.date,
            from: message.envelope!.from!.map((f) => f.address).join(", "),
            text: parsedEmail.text,
          });
        }
      }
    } finally {
      // Make sure lock is released, otherwise next `getMailboxLock()` never returns
      lock.release();
    }
    // log out and close connection
    await client.logout();
    return NextResponse.json(emailList, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json({ error: `${err}` }, { status: 500 });
  }
}
