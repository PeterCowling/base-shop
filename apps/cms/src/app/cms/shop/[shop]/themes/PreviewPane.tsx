"use client";

import { type CSSProperties,useEffect, useRef, useState } from "react";

import { type DevicePreset,devicePresets } from "@acme/ui/utils/devicePresets";

import StyleEditor from "@/components/cms/StyleEditor";

import PreviewDeviceSelector from "../../../wizard/PreviewDeviceSelector";
import TokenInspector from "../../../wizard/TokenInspector";
import { type TokenMap } from "../../../wizard/tokenUtils";
import WizardPreview from "../../../wizard/WizardPreview";

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
  const [device, setDevice] = useState<DevicePreset>(devicePresets[0]);

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
      <PreviewDeviceSelector onChange={setDevice} />
      <TokenInspector inspectMode onTokenSelect={(t) => setSelectedToken(t)}>
        <WizardPreview style={style} device={device} />
      </TokenInspector>
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
