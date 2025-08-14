"use client";

import StyleEditor from "@/components/cms/StyleEditor";
import WizardPreview from "../../wizard/WizardPreview";
import useStepCompletion from "../hooks/useStepCompletion";
import { useState } from "react";
import { type TokenMap } from "../../wizard/tokenUtils";
import { useConfigurator } from "../ConfiguratorContext";
import { useThemeLoader } from "../hooks/useThemeLoader";
import { StepControls } from "../steps";

interface Props {
  previousStepId?: string;
  nextStepId?: string;
}

export default function StepTokens({
  previousStepId,
  nextStepId,
}: Props): React.JSX.Element {
  const themeStyle = useThemeLoader();
  const [, markComplete] = useStepCompletion("tokens");
  const { themeDefaults, themeOverrides, setThemeOverrides } = useConfigurator();
  const tokens = { ...themeDefaults, ...themeOverrides } as TokenMap;
  const [selected, setSelected] = useState<string | null>(null);

  const handleChange = (next: TokenMap) => {
    const overrides: TokenMap = { ...next };
    for (const key of Object.keys(overrides)) {
      if (overrides[key as keyof TokenMap] === themeDefaults[key as keyof TokenMap]) {
        delete overrides[key as keyof TokenMap];
      }
    }
    setThemeOverrides(overrides);
  };

  const previewStyle = { ...themeStyle, ...tokens } as React.CSSProperties;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customize Tokens</h2>
      <WizardPreview
        style={previewStyle}
        inspectMode
        onTokenSelect={(t) => setSelected(t)}
      />
      {selected && (
        <StyleEditor
          tokens={themeOverrides}
          baseTokens={themeDefaults}
          onChange={handleChange}
          focusToken={selected}
        />
      )}
      <StepControls
        prev={previousStepId}
        next={nextStepId}
        onNext={() => markComplete(true)}
      />
    </div>
  );
}
