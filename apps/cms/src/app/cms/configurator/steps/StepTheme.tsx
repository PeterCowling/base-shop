"use client";

import { Button } from "@acme/ui/components/atoms/shadcn";
import { useRouter } from "next/navigation";
import useStepCompletion from "../hooks/useStepCompletion";
import { useConfigurator } from "../ConfiguratorContext";
import ThemeEditorForm from "./ThemeEditorForm";
import { useThemePalette } from "./hooks/useThemePalette";
import { STORAGE_KEY } from "../hooks/useConfiguratorPersistence";
import type { ConfiguratorStepProps } from "@/types/configurator";
import { useCallback, useEffect, useState } from "react";
import { Cluster } from "@acme/ui/components/atoms/primitives";

export default function StepTheme({
  themes,
  prevStepId,
  nextStepId,
}: ConfiguratorStepProps): React.JSX.Element {
  // Ensure we always have a concrete array to render, and lazily load if missing
  const [availableThemes, setAvailableThemes] = useState<string[]>(themes ?? []);

  useEffect(() => {
    // If themes were supplied via props, prefer them
    if (themes && themes.length > 0) {
      setAvailableThemes(themes);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/cms/api/theme/list", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { themes?: string[] };
        if (!cancelled) setAvailableThemes(json.themes ?? []);
      } catch {
        // ignore – keep empty list on failure
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [themes]);
  const { state, update } = useConfigurator();
  const { theme } = state;
  const [, markComplete] = useStepCompletion("theme");
  const router = useRouter();

  const {
    colorPalettes,
    palette,
    setPalette,
    themeOverrides,
    themeDefaults,
    handleTokenChange,
    handleReset,
  } = useThemePalette();

  // Preview device controls removed from this step

  const handleThemeChange = useCallback(
    (v: string) => {
      update("theme", v);
      handleReset();
      if (typeof window !== "undefined") {
        try {
          const json = localStorage.getItem(STORAGE_KEY);
          if (json) {
            const data = JSON.parse(json);
            data.theme = v;
            data.themeOverrides = {};
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          }
        } catch {
          /* ignore */
        }
      }
    },
    [update, handleReset]
  );

  return (
    <div className="space-y-4">
      <ThemeEditorForm
        themes={availableThemes}
        theme={theme}
        onThemeChange={handleThemeChange}
        colorPalettes={colorPalettes}
        palette={palette}
        setPalette={setPalette}
        themeOverrides={themeOverrides}
        themeDefaults={themeDefaults}
        onTokensChange={handleTokenChange}
        onReset={handleReset}
      />

      <Cluster justify="between">
        {prevStepId && (
          <Button
            data-cy="back"
            variant="outline"
            onClick={() => router.push(`/cms/configurator/${prevStepId}`)}
          >
            Back
          </Button>
        )}
        {nextStepId && (
          <Button
            data-cy="next"
            onClick={() => {
              markComplete(true);
              router.push(`/cms/configurator/${nextStepId}`);
            }}
          >
            Next
          </Button>
        )}
      </Cluster>
    </div>
  );
}
