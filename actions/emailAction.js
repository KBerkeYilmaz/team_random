"use server";

import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function fetchInbox() {
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL; // validated + defaulted in lib/env.ts
  // AUDIT #83: /api/email is now admin-guarded. A server-to-server fetch does not
  // inherit the user's cookies automatically, so forward them — otherwise the
  // admin's own inbox view would 401.
  const res = await fetch(`${baseUrl}/api/email`, {
    cache: "no-store",
    headers: { Cookie: cookies().toString() },
  }); // Use the full URL to fetch, forwarding the caller's session cookie
  const data = await res.json(); // Convert the response to JSON
  const emails = data || []; // Ensure emails is always an array

  // Check if the fetch was successful
  if (!res.ok) {
    console.error("Failed to fetch emails:", data);
    return { props: { emails: [] } }; // Return empty array on failure
  }
  // Return the fetched emails as props to the component
  return emails; // Ensure emails is always an array
}

export async function fetchUnseen() {
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL; // validated + defaulted in lib/env.ts
  // AUDIT #83: forward the session cookie (see fetchInbox) — /api/email/count is admin-guarded.
  const res = await fetch(`${baseUrl}/api/email/count`, {
    cache: "no-store",
    headers: { Cookie: cookies().toString() },
  }); // Use the full URL to fetch, forwarding the caller's session cookie

  if (!res.ok) {
    console.error("Failed to fetch count:", res);
    return null; // Return null on failure
  }
  const data = await res.json(); // Convert the response to JSON
  const unreadCount = data || 0; // Ensure that unreadCount is always a number
  return unreadCount; // Return the fetched unread email count
}
