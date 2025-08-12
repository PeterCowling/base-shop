"use client";

import { Button } from "@/components/atoms/shadcn";
import StyleEditor from "@/components/cms/StyleEditor";
import WizardPreview from "../../wizard/WizardPreview";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type TokenMap } from "../../wizard/tokenUtils";
import { useConfigurator } from "../ConfiguratorContext";
import { useThemeLoader } from "../hooks/useThemeLoader";

export default function StepTokens(): React.JSX.Element {
  const themeStyle = useThemeLoader();
  const [, markComplete] = useStepCompletion("tokens");
  const router = useRouter();
  const { themeDefaults, themeOverrides, setThemeOverrides } = useConfigurator();
  const [tokens, setTokens] = useState<TokenMap>(themeOverrides);
  const [selected, setSelected] = useState<string | null>(null);

  const handleChange = (next: TokenMap) => {
    setTokens(next);
    setThemeOverrides(next);
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
          tokens={tokens}
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
