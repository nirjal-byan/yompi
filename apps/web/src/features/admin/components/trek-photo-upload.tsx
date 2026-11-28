"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { PHOTO_MAX_BYTES, type TrekPhotoInfo } from "@yompi/shared";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { API_URL } from "@/lib/config";
import { findTrekPhoto, removeTrekPhoto, uploadTrekPhoto } from "../services/trek-photo-api";

const MAX_MEGABYTES = PHOTO_MAX_BYTES / 1024 / 1024;

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

export function TrekPhotoUpload({ slug }: { slug: string }) {
  const [photo, setPhoto] = useState<TrekPhotoInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => findTrekPhoto(slug).then(setPhoto), [slug]);

  useEffect(() => {
    refresh().catch((error) => setMessage(errorText(error)));
  }, [refresh]);

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    setMessage(null);

    try {
      await action();
      await refresh();
      setMessage(success);
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    void run(async () => {
      await uploadTrekPhoto(slug, new FormData(form));
      form.reset();
    }, "Photo saved.");
  }

  return (
    <section className="flex flex-col gap-4 border border-border-soft bg-surface p-5">
      <div>
        <h2 className="font-display text-xl font-semibold">Photo</h2>
        <p className="text-sm text-muted">
          JPEG, PNG or WebP up to {MAX_MEGABYTES} MB. Only upload photos you took or are licensed to
          use. The credit is shown on the photo.
        </p>
      </div>

      {photo && (
        <div className="flex flex-wrap items-end gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${API_URL}/trek-photos/files/${photo.fileName}`}
            alt="Current trek photo"
            className="h-32 w-52 border border-border-soft object-cover"
          />
          <p className="text-sm text-muted">
            {photo.author}, {photo.license}
          </p>
          <Button
            type="button"
            variant="soft"
            disabled={busy}
            onClick={() => run(() => removeTrekPhoto(slug), "Photo removed.")}
          >
            Remove photo
          </Button>
        </div>
      )}

      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Image file" htmlFor="photo-file">
          <input
            id="photo-file"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="text-sm"
          />
        </Field>
        <Field label="Photographer" htmlFor="photo-author">
          <Input id="photo-author" name="author" required />
        </Field>
        <Field label="Licence" htmlFor="photo-license">
          <Input
            id="photo-license"
            name="license"
            required
            placeholder="e.g. CC BY 4.0 or Own photo"
          />
        </Field>
        <Field label="Licence link (optional)" htmlFor="photo-license-url">
          <Input id="photo-license-url" name="licenseUrl" type="url" placeholder="https://" />
        </Field>
        <Field label="Source link (optional)" htmlFor="photo-source-url">
          <Input id="photo-source-url" name="sourceUrl" type="url" placeholder="https://" />
        </Field>
        <div className="flex items-end">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : photo ? "Replace photo" : "Upload photo"}
          </Button>
        </div>
      </form>

      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
