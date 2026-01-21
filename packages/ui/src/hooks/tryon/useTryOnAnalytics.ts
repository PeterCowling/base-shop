"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";

import { getTryOnCtx, logTryOnEvent,setTryOnCtx } from "./analytics";

export type TryOnMode = 'accessory' | 'garment';

export interface UseTryOnAnalyticsOptions {
  /** Default mode to assume when inferring context from the page */
  mode?: TryOnMode;
  /** Optional override product id (slug). If omitted, reads from route params. */
  productId?: string;
}

export function useTryOnAnalytics(opts: UseTryOnAnalyticsOptions = {}) {
  const params = useParams() as Record<string, string | string[]> | null;
  const slug = useMemo(() => {
    if (opts.productId) return opts.productId;
    const p = params?.slug;
    if (!p) return undefined;
    return Array.isArray(p) ? p[0] : p;
  }, [params, opts.productId]);

  const mode: TryOnMode = opts.mode ?? 'accessory';

  useEffect(() => {
    if (slug) setTryOnCtx({ productId: slug, mode });
  }, [slug, mode]);

  return {
    ctx: getTryOnCtx(),
    setCtx: setTryOnCtx,
    clear: () => setTryOnCtx({ productId: undefined, mode: undefined, idempotencyKey: undefined }),
    started: (idempotencyKey?: string) => {
      if (idempotencyKey) setTryOnCtx({ idempotencyKey });
      return logTryOnEvent('TryOnStarted');
    },
    previewShown: (preprocessMs?: number) => logTryOnEvent('TryOnPreviewShown', preprocessMs ? { preprocessMs } : undefined),
    enhanced: (generateMs?: number) => logTryOnEvent('TryOnEnhanced', generateMs ? { generateMs } : undefined),
    addToCart: (transform?: Record<string, unknown>) => logTryOnEvent('TryOnAddToCart', transform ? { transform } : undefined),
    error: (code?: string, message?: string) => logTryOnEvent('TryOnError', { code, message }),
  } as const;
}

