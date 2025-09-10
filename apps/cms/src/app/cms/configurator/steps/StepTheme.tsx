"use client";

import { Button } from "@ui/components/atoms/shadcn";
import { useRouter } from "next/navigation";
import useStepCompletion from "../hooks/useStepCompletion";
import { useThemeLoader } from "../hooks/useThemeLoader";
import { useConfigurator } from "../ConfiguratorContext";
import ThemeEditorForm from "./ThemeEditorForm";
import { useThemePalette } from "./hooks/useThemePalette";
import { useThemePreviewDevice } from "./hooks/useThemePreviewDevice";
import { STORAGE_KEY } from "../hooks/useConfiguratorPersistence";
import type { ConfiguratorStepProps } from "@/types/configurator";
import { useCallback } from "react";

export default function StepTheme({
  themes,
  prevStepId,
  nextStepId,
}: ConfiguratorStepProps): React.JSX.Element {
  const themeStyle = useThemeLoader();
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

  const { device, deviceId, orientation, setDeviceId, toggleOrientation } =
    useThemePreviewDevice();

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
            window.dispatchEvent(new CustomEvent("configurator:update"));
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
        themes={themes}
        theme={theme}
        onThemeChange={handleThemeChange}
        colorPalettes={colorPalettes}
        palette={palette}
        setPalette={setPalette}
        themeOverrides={themeOverrides}
        themeDefaults={themeDefaults}
        onTokensChange={handleTokenChange}
        onReset={handleReset}
        deviceId={deviceId}
        orientation={orientation}
        setDeviceId={setDeviceId}
        toggleOrientation={toggleOrientation}
        device={device}
        themeStyle={themeStyle}
      />
      <div className="flex justify-between">
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
      </div>
    </div>
  );
}

