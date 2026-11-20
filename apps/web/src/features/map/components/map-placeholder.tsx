import { Button } from "@/components/ui/button";

interface MapPlaceholderProps {
  failed: boolean;
  onRetry: () => void;
}

export function MapPlaceholder({ failed, onRetry }: MapPlaceholderProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-muted">
      {failed ? (
        <>
          <p>We couldn&apos;t load the map data. Is the API running?</p>
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </>
      ) : (
        <p>Unfolding the map…</p>
      )}
    </div>
  );
}
