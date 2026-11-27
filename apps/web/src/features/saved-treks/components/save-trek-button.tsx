"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { useSavedTrek } from "../hooks/use-saved-trek";

export function SaveTrekButton({ slug }: { slug: string }) {
  const { status, saved, busy, failed, toggle } = useSavedTrek(slug);

  if (status === "unavailable") return null;

  if (status === "signed-out") {
    return (
      <ButtonLink href="/join" variant="soft">
        Sign in to save
      </ButtonLink>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="soft"
        onClick={toggle}
        disabled={status === "loading" || busy}
        aria-pressed={saved}
      >
        {saved ? "♥ Saved" : "♡ Save trek"}
      </Button>
      {failed && (
        <p role="alert" className="text-xs text-muted">
          That didn&apos;t save. Please try again.
        </p>
      )}
    </div>
  );
}
