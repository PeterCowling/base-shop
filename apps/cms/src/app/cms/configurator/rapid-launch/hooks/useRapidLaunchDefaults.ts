"use client";

import { useCallback, useEffect, useState } from "react";

import type { LegalBundle } from "@acme/templates";
import type { ProviderTemplate } from "@acme/templates";
import type { ThemeRegistryEntry } from "@acme/types";

export interface RapidLaunchDefaultsResponse {
  defaults: {
    themeId: string;
    paymentTemplateId: string;
    shippingTemplateId: string;
    taxTemplateId: string;
    legalBundleId: string;
    consentTemplateId: string;
  };
  options: {
    themes: ThemeRegistryEntry[];
    paymentTemplates: ProviderTemplate[];
    shippingTemplates: ProviderTemplate[];
    taxTemplates: ProviderTemplate[];
    legalBundles: Array<
      Pick<LegalBundle, "id" | "name" | "approved" | "rapidLaunch" | "rapidLaunchOrder"> & {
        consentId: string;
      }
    >;
    consentTemplates: LegalBundle["documents"]["consent"][];
  };
}

export interface RapidLaunchDefaultsState {
  data: RapidLaunchDefaultsResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRapidLaunchDefaults(): RapidLaunchDefaultsState {
  const [data, setData] = useState<RapidLaunchDefaultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    let active = true;

    void fetch("/api/rapid-launch/defaults", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load rapid launch defaults (${res.status})`);
        }
        const payload = (await res.json()) as RapidLaunchDefaultsResponse;
        if (active) setData(payload);
      })
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;
        if (active) {
          setError((err as Error).message ?? "Failed to load rapid launch defaults");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const abort = load();
    return () => abort?.();
  }, [load]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh };
}
