"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";
import StyleEditor from "@/components/cms/StyleEditor";
import WizardPreview from "../../../wizard/WizardPreview";
import { type TokenMap } from "../../../wizard/tokenUtils";

interface Props {
  style: CSSProperties;
  tokens: TokenMap;
  baseTokens: TokenMap;
  onChange: (next: TokenMap) => void;
}

export default function PreviewPane({
  style,
  tokens,
  baseTokens,
  onChange,
}: Props) {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const styleEditorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedToken) {
      styleEditorRef.current?.scrollIntoView?.({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedToken]);

  return (
    <>
      <WizardPreview
        style={style}
        inspectMode
        onTokenSelect={(t) => setSelectedToken(t)}
      />
      {selectedToken && (
        <div ref={styleEditorRef}>
          <StyleEditor
            tokens={tokens}
            baseTokens={baseTokens}
            onChange={onChange}
            focusToken={selectedToken}
          />
        </div>
      )}
    </>
  );
}
