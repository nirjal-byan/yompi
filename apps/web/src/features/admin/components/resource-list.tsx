"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { type AdminResource, isStale } from "@yompi/shared";
import { Button, ButtonLink } from "@/components/ui/button";
import { AdminApiError, adminApi } from "../services/admin-api";
import { CONFIGS } from "../config";

type Row = Record<string, unknown> & { slug: string; verifiedAt: string };

export function ResourceList({ resource }: { resource: AdminResource }) {
  const config = CONFIGS[resource];
  const saved = useSearchParams().get("saved");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .list<Row>(resource)
      .then((data) => !cancelled && setRows(data))
      .catch(() => !cancelled && setError("We couldn't load this list. Is the API running?"));
    return () => {
      cancelled = true;
    };
  }, [resource, reload]);

  async function remove(row: Row) {
    if (!window.confirm(`Delete "${String(row[config.nameField])}"? This cannot be undone.`))
      return;
    try {
      await adminApi.remove(resource, row.slug);
      setReload((n) => n + 1);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "Could not delete. Please try again.");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{config.plural}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">{config.intro}</p>
        </div>
        <ButtonLink href={`/admin/${resource}/new`}>Add {config.singular}</ButtonLink>
      </div>

      {saved && (
        <p role="status" className="border-l-2 border-accent bg-accent-soft px-4 py-2 text-sm">
          Saved.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="border-l-2 border-red-600 bg-red-50 px-4 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {!rows && !error && <p className="text-sm text-muted">Loading…</p>}
      {rows && rows.length === 0 && (
        <div className="border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">No {config.plural.toLowerCase()} yet.</p>
          <ButtonLink href={`/admin/${resource}/new`} className="mt-4">
            Add the first {config.singular}
          </ButtonLink>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="overflow-x-auto border border-border-soft bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted font-mono text-[11px] text-muted uppercase">
              <tr>
                {config.columns.map((c) => (
                  <th key={c.header} className="px-4 py-2.5 font-normal">
                    {c.header}
                  </th>
                ))}
                <th className="px-4 py-2.5 font-normal">Checked</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {rows.map((row) => (
                <tr key={row.slug}>
                  {config.columns.map((c, i) => (
                    <td key={c.header} className="px-4 py-3">
                      {i === 0 ? (
                        <Link
                          href={`/admin/${resource}/${row.slug}`}
                          className="font-medium underline"
                        >
                          {c.value(row)}
                        </Link>
                      ) : (
                        c.value(row)
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.verifiedAt}
                    {isStale(row.verifiedAt) && (
                      <span className="ml-2 bg-primary/30 px-1.5 py-0.5 text-[11px]">re-check</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <ButtonLink
                      href={`/admin/${resource}/${row.slug}`}
                      variant="outline"
                      className="h-8 px-3"
                    >
                      Edit
                    </ButtonLink>{" "}
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-red-800"
                      onClick={() => remove(row)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
