import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-primary text-foreground hover:bg-primary-hover",
  dark: "bg-foreground text-background hover:opacity-90",
  outline: "bg-surface text-foreground hover:bg-surface-muted",
  soft: "bg-surface-muted text-foreground hover:bg-border-soft border-transparent",
} as const;

const base =
  "inline-flex h-11 items-center justify-center gap-2 border border-border px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

type Variant = keyof typeof variants;

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}
