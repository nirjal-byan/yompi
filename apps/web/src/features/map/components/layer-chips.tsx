import { cn } from "@/lib/cn";
import type { MapLayers } from "../lib/map-engine";

const LAYER_CHIPS: Array<{ key: keyof MapLayers; label: string }> = [
  { key: "terrain", label: "Terrain" },
  { key: "peaks", label: "Peaks" },
  { key: "lakes", label: "Lakes" },
  { key: "passes", label: "Passes" },
  { key: "trails", label: "Trails" },
  { key: "places", label: "Cities & gateways" },
];

interface LayerChipsProps {
  layers: MapLayers;
  onToggle: (key: keyof MapLayers) => void;
}

export function LayerChips({ layers, onToggle }: LayerChipsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Map layers">
      {LAYER_CHIPS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          aria-pressed={layers[key]}
          onClick={() => onToggle(key)}
          className={cn(
            "h-9 px-4 text-sm transition-colors",
            layers[key] ? "bg-foreground text-background" : "bg-surface-muted hover:bg-border-soft",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
