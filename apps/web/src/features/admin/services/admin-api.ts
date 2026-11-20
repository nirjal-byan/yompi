import type { AdminOverview, AdminResource, FieldError } from "@yompi/shared";
import { API_URL } from "@/lib/config";

/** An admin API error. `errors` holds per-field messages when the server rejected the form. */
export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors: FieldError[] = [],
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/admin${path}`, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as { errors?: FieldError[]; message?: string } | null;
  if (!res.ok) {
    throw new AdminApiError(res.status, body?.message ?? "Something went wrong. Please try again.", body?.errors ?? []);
  }
  return body as T;
}

export const adminApi = {
  overview: () => request<AdminOverview>("/overview"),
  trails: () => request<string[]>("/trails"),
  list: <T>(resource: AdminResource) => request<T[]>(`/${resource}`),
  get: <T>(resource: AdminResource, slug: string) => request<T>(`/${resource}/${slug}`),
  create: <T>(resource: AdminResource, data: unknown) =>
    request<T>(`/${resource}`, { method: "POST", body: JSON.stringify(data) }),
  update: <T>(resource: AdminResource, slug: string, data: unknown) =>
    request<T>(`/${resource}/${slug}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (resource: AdminResource, slug: string) => request<void>(`/${resource}/${slug}`, { method: "DELETE" }),
};
