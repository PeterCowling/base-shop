"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";
import StyleEditor from "@/components/cms/StyleEditor";
import WizardPreview from "../../../wizard/WizardPreview";
import TokenInspector from "../../../wizard/TokenInspector";
import PreviewDeviceSelector from "../../../wizard/PreviewDeviceSelector";
import { devicePresets, type DevicePreset } from "@acme/ui/utils/devicePresets";
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
