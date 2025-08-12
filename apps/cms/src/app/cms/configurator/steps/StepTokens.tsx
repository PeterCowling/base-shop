"use client";

import { Button } from "@/components/atoms/shadcn";
import StyleEditor from "@/components/cms/StyleEditor";
import WizardPreview from "../../wizard/WizardPreview";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { baseTokens, type TokenMap } from "../../wizard/tokenUtils";
import { useConfigurator } from "../ConfiguratorContext";

interface Props {
  themeStyle: React.CSSProperties;
}

export default function StepTokens({ themeStyle }: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("tokens");
  const router = useRouter();
  const { state, update } = useConfigurator();
  const [tokens, setTokens] = useState<TokenMap>(state.themeVars);
  const [selected, setSelected] = useState<string | null>(null);

  const handleChange = (next: TokenMap) => {
    setTokens(next);
    update("themeVars", next);
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
          baseTokens={baseTokens}
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
