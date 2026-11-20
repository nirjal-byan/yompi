import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-12 w-full border border-border-soft bg-surface px-3 text-sm text-foreground focus:border-border focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
