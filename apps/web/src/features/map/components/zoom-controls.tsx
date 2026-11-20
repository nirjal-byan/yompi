interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut }: ZoomControlsProps) {
  return (
    <div className="absolute top-3 right-3 flex flex-col border border-border bg-surface">
      <button
        type="button"
        aria-label="Zoom in"
        onClick={onZoomIn}
        className="h-10 w-10 text-xl hover:bg-surface-muted"
      >
        +
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        onClick={onZoomOut}
        className="h-10 w-10 border-t border-border text-xl hover:bg-surface-muted"
      >
        −
      </button>
    </div>
  );
}
