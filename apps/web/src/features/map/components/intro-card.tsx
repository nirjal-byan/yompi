import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

export function IntroCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="w-[min(320px,100%)] border border-border bg-surface p-5 shadow-md">
      <Tag className="bg-primary/30 text-foreground">Your next chapter</Tag>
      <h2 className="mt-3 font-display text-3xl leading-tight font-semibold">
        Let&apos;s explore
        <br />
        the Himalayas!
      </h2>
      <p className="mt-2 text-sm text-muted">
        Drag the map, scroll to zoom and tap a highlighted peak to see how high it is.
      </p>
      <Button className="mt-4 w-full" onClick={onStart}>
        Start with Annapurna →
      </Button>
    </div>
  );
}
