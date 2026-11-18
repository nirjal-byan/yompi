import { cookies } from "next/headers";
import type { AuthUser } from "@yompi/shared";
import { API_URL } from "@/lib/config";

/** Server-side: resolves the signed-in user from the request cookies, or null. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookie = (await cookies()).toString();
  if (!cookie) return null;
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { cookie },
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as AuthUser) : null;
  } catch {
    return null;
  }
}
