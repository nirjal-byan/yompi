import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { JoinForm } from "@/features/auth/components/join-form";
import { Tag } from "@/components/ui/tag";

export const metadata: Metadata = { title: "Join YOMPI" };

/**
 * On desktop the page fills exactly the space between navbar (73px) and footer (41px),
 * so it never scrolls. On short viewports the min-height lets the page scroll instead of clipping.
 */
export default function JoinPage() {
  return (
    <main className="mx-auto grid w-full max-w-[1200px] flex-1 gap-8 px-6 py-6 lg:h-[calc(100dvh-114px)] lg:min-h-[600px] lg:grid-cols-2 lg:overflow-hidden">
      {/* Illustration panel: a pixel-art valley (apps/web/scripts/generate-join-scene.mjs), shown with crisp pixels. */}
      <section aria-hidden className="relative hidden h-full overflow-hidden border border-border lg:block">
        <Image
          src="/brand/join-scene.png"
          alt=""
          fill
          priority
          unoptimized
          sizes="(min-width: 1024px) 560px, 0px"
          className="object-cover object-bottom [image-rendering:pixelated]"
        />
        <div className="relative flex h-full flex-col justify-between p-6">
          <div className="border border-border bg-surface p-6">
            <p className="font-mono text-[11px] uppercase text-accent">Welcome to your next chapter</p>
            <h2 className="mt-4 font-display text-5xl leading-[1.1] font-semibold">
              A whole world.
              <br />
              One little hop.
            </h2>
            <p className="mt-2 text-sm text-muted">Save the places that make you say &ldquo;let&apos;s go.&rdquo;</p>
          </div>
          <p className="border border-border bg-surface px-4 py-3 text-sm">
            Your adventure is waiting. I&apos;ll keep your plans safe.
          </p>
        </div>
      </section>

      {/* Top-aligned (not centred) so nothing above the form moves when its content changes. */}
      <section className="flex flex-col gap-4 lg:pt-6">
        <Tag className="self-start">Free to explore</Tag>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Make it your adventure.</h1>
        <p className="text-muted">Save trips, plan together and pick up where you left off.</p>
        <Suspense>
          <JoinForm />
        </Suspense>
      </section>
    </main>
  );
}
