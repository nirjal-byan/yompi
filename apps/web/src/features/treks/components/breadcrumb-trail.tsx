import Link from "next/link";

interface BreadcrumbTrailProps {
  items: Array<{ label: string; href?: string }>;
}

export function BreadcrumbTrail({ items }: BreadcrumbTrailProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map(({ label, href }, index) => (
          <li key={label} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden>/</span>}
            {href ? (
              <Link href={href} className="hover:text-foreground hover:underline">
                {label}
              </Link>
            ) : (
              <span aria-current="page">{label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
