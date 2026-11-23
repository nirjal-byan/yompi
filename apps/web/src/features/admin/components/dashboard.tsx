"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminOverview } from "@yompi/shared";
import { ButtonLink } from "@/components/ui/button";
import { adminApi } from "../services/admin-api";
import { CONFIGS, RESOURCES } from "../config";
import { ConditionIcon, CostIcon, PermitIcon, StayIcon, TrekIcon } from "./icons";

const ICONS = {
  treks: TrekIcon,
  permits: PermitIcon,
  costs: CostIcon,
  stays: StayIcon,
  conditions: ConditionIcon,
};

function StatIcon({ kind }: { kind: keyof typeof ICONS }) {
  const Icon = ICONS[kind];
  return <Icon width={20} height={20} />;
}

export function Dashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .overview()
      .then((data) => !cancelled && setOverview(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed)
    return (
      <p className="text-sm text-muted">We couldn&apos;t load the dashboard. Is the API running?</p>
    );
  if (!overview) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">
          Add the trek details visitors see on the map. Every figure needs a source link and the
          date you checked it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {RESOURCES.map((key) => (
          <div key={key} className="flex flex-col gap-3 border border-border bg-surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-4xl font-semibold">{overview.counts[key]}</p>
                <p className="text-sm text-muted">{CONFIGS[key].plural.toLowerCase()} saved</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center bg-primary/30">
                <StatIcon kind={key} />
              </span>
            </div>
            <div className="mt-auto flex gap-2">
              <ButtonLink href={`/admin/${key}/new`} className="h-9 px-3">
                Add {CONFIGS[key].singular}
              </ButtonLink>
              <ButtonLink href={`/admin/${key}`} variant="outline" className="h-9 px-3">
                See all
              </ButtonLink>
            </div>
          </div>
        ))}
      </div>

      <section aria-labelledby="todo">
        <h2 id="todo" className="font-display text-2xl font-semibold">
          To do
        </h2>
        {overview.attention.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Nothing needs attention. Every trail has details and nothing is out of date.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border-soft border border-border-soft bg-surface">
            {overview.attention.map((item, index) => (
              <li key={`${item.resource}-${item.slug ?? item.label}-${index}`}>
                <Link
                  href={
                    item.slug
                      ? `/admin/${item.resource}/${item.slug}`
                      : `/admin/${item.resource}/new?trail=${encodeURIComponent(item.label)}`
                  }
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-surface-muted"
                >
                  <span>
                    <span className="font-medium">{item.label}</span>
                    <span className="block text-sm text-muted">{item.message}</span>
                  </span>
                  <span className="text-sm text-accent underline">
                    {item.slug ? "Open" : "Add details"} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
