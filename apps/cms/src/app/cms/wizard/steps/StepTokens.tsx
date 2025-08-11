"use client";

import { Button } from "@/components/atoms/shadcn";
import StyleEditor from "@/components/cms/StyleEditor";
import { type TokenMap } from "@ui/hooks/useTokenEditor";
import { useEffect, useRef, useState } from "react";
import WizardPreview from "../WizardPreview";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

interface Props {
  themeStyle: React.CSSProperties;
}

export default function StepTokens({
  themeStyle,
}: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("tokens");
  const router = useRouter();
  const [tokens, setTokens] = useState<TokenMap>(themeStyle as TokenMap);
  const [inspect, setInspect] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected || !editorRef.current) return;
    const el = editorRef.current.querySelector<HTMLElement>(
      `[data-token="${selected}"]`
    );
    el?.scrollIntoView({ block: "center" });
    el?.classList.add("ring-2", "ring-blue-500");
    setTimeout(() => el?.classList.remove("ring-2", "ring-blue-500"), 1000);
  }, [selected]);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customize Tokens</h2>
      <div className="flex justify-end">
        <Button variant={inspect ? "destructive" : "outline"} onClick={() => setInspect((v) => !v)}>
          {inspect ? "Cancel" : "Inspect Element"}
        </Button>
      </div>
      <WizardPreview
        style={tokens as React.CSSProperties}
        inspectMode={inspect}
        onSelectToken={(t) => {
          setSelected(t);
          setInspect(false);
        }}
      />
      {selected && (
        <div ref={editorRef}>
          <StyleEditor tokens={tokens} onChange={setTokens} />
        </div>
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
