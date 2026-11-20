"use client";

import { useEffect, useState } from "react";
import type { ResourceCounts } from "../lib/admin-navigation";
import { adminApi } from "../services/admin-api";

export function useResourceCounts(refreshKey: string): ResourceCounts | null {
  const [counts, setCounts] = useState<ResourceCounts | null>(null);

  useEffect(() => {
    let cancelled = false;

    adminApi
      .overview()
      .then((overview) => !cancelled && setCounts(overview.counts))
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return counts;
}
