"use server";

export async function fetchInbox() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"; // Define the base URL
  const res = await fetch(`${baseUrl}/api/email`, { cache: "no-store" }); // Use the full URL to fetch
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
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"; // Define the base URL
  const res = await fetch(`${baseUrl}/api/email/count`, { cache: "no-store" }); // Use the full URL to fetch

  if (!res.ok) {
    console.error("Failed to fetch count:", res);
    return null; // Return null on failure
  }
  const data = await res.json(); // Convert the response to JSON
  const unreadCount = data || 0; // Ensure that unreadCount is always a number
  return unreadCount; // Return the fetched unread email count
}
