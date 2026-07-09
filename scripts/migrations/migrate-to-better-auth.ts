// scripts/migrations/migrate-to-better-auth.ts
// One-time migration: legacy next-auth `users` (Mongoose) -> Better Auth
// `user` + `account`, PRESERVING existing bcrypt password hashes (no reset).
//
// Run MANUALLY against a COPY of the database first:
//   node --env-file=.env.local --import tsx scripts/migrations/migrate-to-better-auth.ts
//
// Field mapping (verified against Better Auth's mongodbAdapter schema):
//   legacy users.userMail     -> user.email
//   legacy users.fullName     -> user.name
//   legacy users.img          -> user.image
//   legacy users.role         -> user.role        (surfaced by the admin plugin)
//   legacy users.userPassword -> account.password (the SAME bcrypt hash)
// Better Auth uses ObjectId for user._id / account.userId, and the string hex of
// the user id for account.accountId; credential logins live on providerId
// "credential". This script mirrors that exactly. It is idempotent — a user
// whose email already exists in the Better Auth `user` collection is skipped.
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("scripts/migrations/migrate-to-better-auth.ts: MONGO_URI is not set.");

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db();

  const legacyUsers = await db.collection("users").find({}).toArray();
  console.log(`Found ${legacyUsers.length} legacy user(s) to migrate.`);

  let migrated = 0;
  let skipped = 0;
  const now = new Date();

  for (const legacy of legacyUsers) {
    const email: string | undefined = legacy.userMail;
    const legacyHash: string | undefined = legacy.userPassword;

    if (!email || !legacyHash) {
      console.log(`- SKIP (missing email/hash): ${legacy._id}`);
      skipped++;
      continue;
    }

    const exists = await db.collection("user").findOne({ email });
    if (exists) {
      console.log(`- SKIP (already migrated): ${email}`);
      skipped++;
      continue;
    }

    const userId = new ObjectId();

    await db.collection("user").insertOne({
      _id: userId,
      name: legacy.fullName ?? "",
      email,
      emailVerified: false,
      image: legacy.img ?? null,
      role: legacy.role ?? "user",
      banned: false,
      createdAt: legacy.createdAt ?? now,
      updatedAt: legacy.updatedAt ?? now,
    });

    await db.collection("account").insertOne({
      _id: new ObjectId(),
      userId, // ObjectId reference to user._id
      accountId: userId.toHexString(), // string hex, per Better Auth's schema
      providerId: "credential",
      password: legacyHash, // preserved bcrypt hash — no forced reset
      createdAt: now,
      updatedAt: now,
    });

    console.log(`- migrated: ${email} (role=${legacy.role ?? "user"})`);
    migrated++;
  }

  console.log(`\nDone. migrated=${migrated} skipped=${skipped}`);
  await client.close();
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
