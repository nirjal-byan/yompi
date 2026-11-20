import type { GeoSource } from "@yompi/shared";
import { TERRAIN_ATTRIBUTION } from "../constants";

interface MapAttributionProps {
  sources: GeoSource[];
  showTerrain: boolean;
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
      {children}
    </a>
  );
}

export function MapAttribution({ sources, showTerrain }: MapAttributionProps) {
  return (
    <p className="absolute right-3 bottom-3 max-w-[45%] bg-surface/90 px-2 py-1 text-right text-[10px] text-muted">
      {sources.map((source, index) => (
        <span key={source.key}>
          {index > 0 && " · "}
          <ExternalLink href={source.url}>{source.attribution}</ExternalLink>
        </span>
      ))}
      {showTerrain && (
        <>
          {" · "}
          <ExternalLink href={TERRAIN_ATTRIBUTION.url}>{TERRAIN_ATTRIBUTION.text}</ExternalLink>
        </>
      )}
    </p>
  );
}
