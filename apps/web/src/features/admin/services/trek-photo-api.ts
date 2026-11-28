import type { FieldError, TrekPhotoInfo } from "@yompi/shared";
import { API_URL } from "@/lib/config";

const ENDPOINT = `${API_URL}/trek-photos`;

async function failureMessage(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as {
    message?: string;
    errors?: FieldError[];
  } | null;
  const fieldErrors = body?.errors?.map((error) => `${error.field}: ${error.message}`).join(", ");

  if (response.status === 413) return "That file is too large. The limit is 5 MB.";

  return fieldErrors || body?.message || "Something went wrong. Please try again.";
}

export async function findTrekPhoto(slug: string): Promise<TrekPhotoInfo | null> {
  const response = await fetch(ENDPOINT, { cache: "no-store" });
  if (!response.ok) throw new Error(await failureMessage(response));
  const photos = (await response.json()) as TrekPhotoInfo[];

  return photos.find((photo) => photo.trekSlug === slug) ?? null;
}

async function send(slug: string, init: RequestInit): Promise<void> {
  const response = await fetch(`${ENDPOINT}/${encodeURIComponent(slug)}`, {
    ...init,
    credentials: "include",
  });
  if (!response.ok) throw new Error(await failureMessage(response));
}

export const uploadTrekPhoto = (slug: string, form: FormData) =>
  send(slug, { method: "PUT", body: form });

export const removeTrekPhoto = (slug: string) => send(slug, { method: "DELETE" });
