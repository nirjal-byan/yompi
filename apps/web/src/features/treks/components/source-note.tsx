import type { SourceCitation } from "@yompi/shared";

export function SourceNote({ source }: { source: SourceCitation }) {
  return (
    <span className="text-[11px] text-muted">
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">
        {source.name}
      </a>
      , checked {source.verifiedAt}
      {source.stale && (
        <span className="ml-1 bg-primary/30 px-1 text-foreground">may be out of date</span>
      )}
    </span>
  );
}
