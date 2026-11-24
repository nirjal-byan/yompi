import { cn } from "@/lib/cn";
import { formatMetres } from "../lib/format";
import type { JourneyStep } from "../lib/journey";

interface ElevationStripProps {
  steps: JourneyStep[];
  activeKey: string | null;
  onSelect: (key: string) => void;
}

interface ElevationPoint {
  key: string;
  dayNumber: number;
  elevationM: number;
  x: number;
  y: number;
}

const MIN_POINTS = 3;
const VERTICAL_PADDING_PCT = 18;

function buildPoints(steps: JourneyStep[]): ElevationPoint[] {
  const known = steps.flatMap((step, index) =>
    step.overnightElevationM ? [{ step, index, elevationM: step.overnightElevationM }] : [],
  );
  if (known.length < MIN_POINTS) return [];

  const low = Math.min(...known.map((point) => point.elevationM));
  const high = Math.max(...known.map((point) => point.elevationM));
  const range = Math.max(high - low, 1);
  const usable = 100 - VERTICAL_PADDING_PCT * 2;
  const lastIndex = Math.max(steps.length - 1, 1);

  return known.map(({ step, index, elevationM }) => ({
    key: step.key,
    dayNumber: step.dayNumber,
    elevationM,
    x: (index / lastIndex) * 94 + 3,
    y: 100 - VERTICAL_PADDING_PCT - ((elevationM - low) / range) * usable,
  }));
}

export function ElevationStrip({ steps, activeKey, onSelect }: ElevationStripProps) {
  const points = buildPoints(steps);
  if (points.length === 0) return null;

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${points[0].x},100 ${line} ${points[points.length - 1].x},100`;

  return (
    <figure className="flex flex-col gap-2 border border-border-soft bg-surface p-4">
      <figcaption className="font-mono text-[10px] text-muted uppercase">
        Where you sleep, by height. Tap a point to jump to that day.
      </figcaption>
      <div className="relative h-32">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <polygon points={area} className="fill-accent-soft" />
          <polyline
            points={line}
            fill="none"
            className="stroke-foreground"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {points.map((point) => {
          const active = point.key === activeKey;

          return (
            <button
              key={point.key}
              type="button"
              onClick={() => onSelect(point.key)}
              aria-label={`Day ${point.dayNumber}, sleeping at ${formatMetres(point.elevationM)}`}
              aria-pressed={active}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              className={cn(
                "absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 border-2 border-foreground transition-transform hover:scale-125",
                active ? "scale-125 bg-primary" : "bg-surface",
              )}
            >
              {active && (
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 bg-foreground px-1.5 py-0.5 text-[10px] whitespace-nowrap text-background">
                  Day {point.dayNumber} · {formatMetres(point.elevationM)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </figure>
  );
}
