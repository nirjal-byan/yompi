import { cn } from "@/lib/cn";
import { areAllFeaturesShown } from "../lib/engine/layers";
import type { MapLayers } from "../lib/map-engine";

const FEATURE_CHIPS: Array<{ key: keyof MapLayers; label: string }> = [
  { key: "peaks", label: "Peaks" },
  { key: "lakes", label: "Lakes" },
  { key: "passes", label: "Passes" },
  { key: "trails", label: "Trails" },
  { key: "places", label: "Cities & gateways" },
];

const CHIP_BASE_CLASS = "h-9 px-4 text-sm transition-colors";
const CHIP_ON_CLASS = "bg-foreground text-background";
const CHIP_OFF_CLASS = "bg-surface-muted hover:bg-border-soft";

interface LayerChipsProps {
  layers: MapLayers;
  onToggle: (key: keyof MapLayers) => void;
  onShowAll: () => void;
}

export function LayerChips({ layers, onToggle, onShowAll }: LayerChipsProps) {
  const showingAll = areAllFeaturesShown(layers);

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Map layers">
      <button
        type="button"
        aria-pressed={layers.terrain}
        onClick={() => onToggle("terrain")}
        className={cn(CHIP_BASE_CLASS, layers.terrain ? CHIP_ON_CLASS : CHIP_OFF_CLASS)}
      >
        Terrain
      </button>
      <span className="mx-1 w-px self-stretch bg-border-soft" aria-hidden />
      <button
        type="button"
        aria-pressed={showingAll}
        onClick={onShowAll}
        className={cn(CHIP_BASE_CLASS, showingAll ? CHIP_ON_CLASS : CHIP_OFF_CLASS)}
      >
        All
      </button>
      {FEATURE_CHIPS.map(({ key, label }) => {
        const active = !showingAll && layers[key];

        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(key)}
            className={cn(CHIP_BASE_CLASS, active ? CHIP_ON_CLASS : CHIP_OFF_CLASS)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
