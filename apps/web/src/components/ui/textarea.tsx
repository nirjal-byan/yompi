import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full border border-border-soft bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/70 focus:border-border focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
