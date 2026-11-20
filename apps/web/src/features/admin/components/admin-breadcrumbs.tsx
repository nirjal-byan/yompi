import Link from "next/link";
import { breadcrumbsFor } from "../lib/admin-navigation";

export function AdminBreadcrumbs({ pathname }: { pathname: string }) {
  const crumbs = breadcrumbsFor(pathname);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-2 text-sm">
        {crumbs.map((crumb, index) => (
          <li key={crumb.label} className="flex min-w-0 items-center gap-2">
            {index > 0 && (
              <span className="text-muted" aria-hidden>
                /
              </span>
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="truncate text-muted hover:text-foreground hover:underline"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate font-medium" aria-current="page">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
