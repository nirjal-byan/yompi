import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Tag({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-block bg-accent-soft px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-accent",
        className,
      )}
      {...props}
    />
  );
}
