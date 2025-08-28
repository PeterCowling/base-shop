"use client";

import { Button } from "@/components/atoms/shadcn";
import StyleEditor from "@ui/components/cms/StyleEditor";
import WizardPreview from "../../wizard/WizardPreview";
import TokenInspector from "../../wizard/TokenInspector";
import PreviewDeviceSelector from "../../wizard/PreviewDeviceSelector";
import { devicePresets, type DevicePreset } from "@ui/utils/devicePresets";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type TokenMap } from "../../wizard/tokenUtils";
import { useConfigurator } from "../ConfiguratorContext";
import { useThemeLoader } from "../hooks/useThemeLoader";
import type { ConfiguratorStepProps } from "@/types/configurator";

export default function StepTokens(_: ConfiguratorStepProps): React.JSX.Element {
  const themeStyle = useThemeLoader();
  const [, markComplete] = useStepCompletion("tokens");
  const router = useRouter();
  const { themeDefaults, themeOverrides, setThemeOverrides } = useConfigurator();
  const tokens = { ...themeDefaults, ...themeOverrides } as TokenMap;
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<DevicePreset>(devicePresets[0]);

  const handleChange = (next: TokenMap) => {
    const overrides: TokenMap = { ...next };
    for (const key of Object.keys(overrides) as Array<keyof TokenMap & string>) {
      if (overrides[key] === themeDefaults[key]) {
        delete overrides[key];
      }
    }
    setThemeOverrides(overrides);
  };

  const previewStyle = { ...themeStyle, ...tokens } as React.CSSProperties;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customize Tokens</h2>
      <PreviewDeviceSelector onChange={setDevice} />
      <TokenInspector inspectMode onTokenSelect={(t) => setSelected(t)}>
        <WizardPreview style={previewStyle} device={device} />
      </TokenInspector>
      {selected && (
        <StyleEditor
          tokens={themeOverrides}
          baseTokens={themeDefaults}
          onChange={handleChange}
          focusToken={selected}
        />
      )}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          Save & return
        </Button>
      </div>
    </div>
  );
}
