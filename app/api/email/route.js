import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import base64 from "base-64";
import { revalidatePath } from "next/cache";
import { simpleParser } from "mailparser";

export async function POST(request) {
  const { email, name, message } = await request.json();

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.APP_EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.APP_EMAIL,
    to: process.env.APP_EMAIL,
    // cc: email, (uncomment this line if you want to send a copy to the sender)
    subject: `Message from ${name} (${email})`,
    text: message,
  };

  const sendMailPromise = () =>
    new Promise((resolve, reject) => {
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
      for await (let message of client.fetch("1:*", {
        envelope: true,
        seen: false,
        bodyParts: true,
        bodyStructure: true,
        source: true
      })) {
        {
          const source = message.source.toString();

          // Parse the email source to extract content
          const parsedEmail = await simpleParser(source);
    
          // Fetch the full raw message source
          emailList.push({
            // envelope: message.envelope,
            uid: message.uid,
            subject: message.envelope.subject,
            date: message.envelope.date,
            from: message.envelope.from.map((f) => f.address).join(", "),
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
