import { type SourceCitation, isSampleSource } from "@yompi/shared";

export function SourceNote({ source }: { source: SourceCitation }) {
  if (isSampleSource(source.url)) {
    return (
      <span className="self-start bg-primary/40 px-1.5 py-0.5 text-[11px] font-semibold text-foreground">
        Sample data, invented for demonstration
      </span>
    );
  }

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
