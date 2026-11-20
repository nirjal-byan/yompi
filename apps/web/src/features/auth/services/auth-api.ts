import type { RequestLinkInput } from "@yompi/shared";
import { API_URL } from "@/lib/config";

export async function requestLoginLink(input: RequestLinkInput): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/request-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) return null;
    if (res.status === 400) return "Please check your details and try again.";
    return "Something went wrong. Please try again in a moment.";
  } catch {
    return "We couldn't reach the server. Please try again.";
  }
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
}
