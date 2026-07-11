// scripts/migrations/migrate-to-better-auth.ts
// One-time migration: legacy next-auth `users` (Mongoose) -> Better Auth
// `user` + `account`, PRESERVING existing bcrypt password hashes (no reset).
//
// SAFETY: this script affects data, so it is DRY-RUN BY DEFAULT — it prints
// exactly what it WOULD write and touches nothing. It actualizes writes only
// when passed `--apply`. This is the dry-run/`--apply` convention for any
// prod-affecting script (issue #159 Part B3; documented in scripts/CLAUDE.md),
// retrofitted here first because it is the migration that motivated the policy.
//
//   Dry-run (default, no writes):
//     node --env-file=.env.local --import tsx scripts/migrations/migrate-to-better-auth.ts
//   Apply (writes user + account docs):
//     node --env-file=.env.local --import tsx scripts/migrations/migrate-to-better-auth.ts --apply
//
// IMPORTANT: `MONGO_URI` must include the database path segment
// (…mongodb.net/team_random_webApp?…) or the driver silently falls back to the
// empty `test` db — the same trap that hid this bug. `client.db()` reads that
// path segment; there is no name passed here.
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
if (!uri)
  throw new Error(
    "scripts/migrations/migrate-to-better-auth.ts: MONGO_URI is not set.",
  );

// Writes happen ONLY with --apply. Absent the flag, this is a no-op dry run.
const APPLY = process.argv.includes("--apply");

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db();

  console.log(
    APPLY
      ? `APPLY mode — writing to database "${db.databaseName}".`
      : `DRY RUN — no writes. Re-run with --apply to migrate. Target db "${db.databaseName}".`,
  );

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

    if (!APPLY) {
      // Dry run: report the write we would make, then move on without touching
      // the database. Counted as "migrated" so the summary previews the effect.
      console.log(
        `- WOULD migrate: ${email} (role=${legacy.role ?? "user"})`,
      );
      migrated++;
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

  const verb = APPLY ? "migrated" : "would migrate";
  console.log(`\nDone (${APPLY ? "APPLY" : "DRY RUN"}). ${verb}=${migrated} skipped=${skipped}`);
  if (!APPLY && migrated > 0)
    console.log("Re-run with --apply to perform these writes.");
  await client.close();
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
