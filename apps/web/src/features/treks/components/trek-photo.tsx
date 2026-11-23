import Image from "next/image";
import { cn } from "@/lib/cn";
import type { TrekImage } from "../lib/trek-image";

interface TrekPhotoProps {
  image: TrekImage | null;
  alt: string;
  caption?: string;
  className?: string;
}

function Credit({ credit }: { credit: NonNullable<TrekImage["credit"]> }) {
  return (
    <>
      Photo:{" "}
      <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
        {credit.author}
      </a>
      ,{" "}
      {credit.licenseUrl ? (
        <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">
          {credit.license}
        </a>
      ) : (
        credit.license
      )}{" "}
      via Wikimedia Commons
    </>
  );
}

export function TrekPhoto({ image, alt, caption, className }: TrekPhotoProps) {
  return (
    <figure
      className={cn("relative min-h-[220px] overflow-hidden border border-border-soft", className)}
    >
      {image ? (
        <Image
          src={image.src}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-accent-soft to-surface-muted" />
      )}
      {(image?.credit || caption) && (
        <figcaption className="absolute right-0 bottom-0 left-0 bg-foreground/60 px-3 py-1.5 text-[11px] text-background">
          {image?.credit ? <Credit credit={image.credit} /> : caption}
        </figcaption>
      )}
    </figure>
  );
}
