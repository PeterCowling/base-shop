"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductHotspotConfig } from "@acme/product-configurator";

type HotspotOffsets = Record<string, { x: number; y: number }>;

type HotspotConfigState = {
  config: ProductHotspotConfig | null;
  status: "idle" | "loading" | "error";
  saveOffsets: (offsets: HotspotOffsets) => Promise<void>;
};

export function useHotspotConfig(productId: string): HotspotConfigState {
  const [config, setConfig] = useState<ProductHotspotConfig | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    if (!productId) return;
    const load = async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/products/${productId}/hotspots`);
        if (!res.ok) throw new Error("Failed to load hotspots");
        const data = (await res.json()) as ProductHotspotConfig;
        if (cancelled) return;
        setConfig(data);
        setStatus("idle");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const saveOffsets = useCallback(
    async (offsets: HotspotOffsets) => {
      if (!config) return;
      const next: ProductHotspotConfig = {
        ...config,
        hotspots: config.hotspots.map((hotspot) => {
          const offset = offsets[hotspot.id];
          return offset ? { ...hotspot, offset } : hotspot;
        }),
      };
      setConfig(next);
      try {
        await fetch(`/api/products/${productId}/hotspots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
      } catch {
        // ignore save errors; offsets stay in memory until reload
      }
    },
    [config, productId],
  );

  return { config, status, saveOffsets };
}
