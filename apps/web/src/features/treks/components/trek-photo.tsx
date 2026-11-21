import Image from "next/image";
import { cn } from "@/lib/cn";

interface TrekPhotoProps {
  src: string | null;
  alt: string;
  caption?: string;
  className?: string;
}

export function TrekPhoto({ src, alt, caption, className }: TrekPhotoProps) {
  return (
    <figure
      className={cn("relative min-h-[220px] overflow-hidden border border-border-soft", className)}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-accent-soft to-surface-muted" />
      )}
      {caption && (
        <figcaption className="absolute bottom-3 left-4 text-[11px] text-background drop-shadow">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
