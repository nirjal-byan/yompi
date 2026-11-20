"use client";

import { useEffect, useState } from "react";
import type { FeatureDetail } from "@yompi/shared";
import { getFeatureDetail } from "../services/geo-api";

interface DetailState {
  id: string | null;
  detail?: FeatureDetail;
  failed?: boolean;
}

export function useFeatureDetail(id: string | null) {
  const [state, setState] = useState<DetailState>({ id: null });

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    getFeatureDetail(id, controller.signal)
      .then((detail) => setState({ id, detail }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ id, failed: true });
      });
    return () => controller.abort();
  }, [id]);

  const current = state.id === id;
  return {
    detail: current ? state.detail : undefined,
    failed: current && !!state.failed,
    loading: !!id && !current,
  };
}
