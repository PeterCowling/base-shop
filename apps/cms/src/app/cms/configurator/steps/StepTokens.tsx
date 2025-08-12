"use client";

import { Button } from "@/components/atoms/shadcn";
import StyleEditor from "@/components/cms/StyleEditor";
import WizardPreview from "../../wizard/WizardPreview";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { type TokenMap } from "../../wizard/tokenUtils";
import { useConfigurator } from "../ConfiguratorContext";

export default function StepTokens(): React.JSX.Element {
  const [, markComplete] = useStepCompletion("tokens");
  const router = useRouter();
  const { state, update } = useConfigurator();
  const { themeDefaults, themeOverrides } = state;

  const [overrides, setOverrides] = useState<TokenMap>(themeOverrides);
  const [selected, setSelected] = useState<string | null>(null);

  const tokens = useMemo(
    () => ({ ...themeDefaults, ...overrides }),
    [themeDefaults, overrides]
  );

  const handleChange = (next: TokenMap) => {
    const nextOverrides: TokenMap = {};
    Object.entries(next).forEach(([k, v]) => {
      if (themeDefaults[k as keyof TokenMap] !== v) {
        nextOverrides[k as keyof TokenMap] = v;
      }
    });
    setOverrides(nextOverrides);
    update("themeOverrides", nextOverrides);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customize Tokens</h2>
      <WizardPreview
        style={tokens as React.CSSProperties}
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
