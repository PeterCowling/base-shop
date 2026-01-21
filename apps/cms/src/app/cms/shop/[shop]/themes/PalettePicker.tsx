// apps/cms/src/app/cms/shop/[shop]/themes/PalettePicker.tsx
"use client";
import type { MutableRefObject } from "react";
import { useState } from "react";

import TokenGroup from "./TokenGroup";

interface Props {
  groupedTokens: Record<string, [string, string][]>;
  overrides: Record<string, string>;
  handleOverrideChange: (
    key: string,
    defaultValue: string,
  ) => (value: string) => void;
  handleReset: (key: string) => () => void;
  handleGroupReset: (keys: string[]) => () => void;
  overrideRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  mergedTokens: Record<string, string>;
  textTokenKeys: string[];
  bgTokenKeys: string[];
  handleWarningChange: (token: string, warning: string | null) => void;
  onTokenSelect: (token: string) => void;
}

export default function PalettePicker({
  groupedTokens,
  overrides,
  handleOverrideChange,
  handleReset,
  handleGroupReset,
  overrideRefs,
  mergedTokens,
  textTokenKeys,
  bgTokenKeys,
  handleWarningChange,
  onTokenSelect,
}: Props) {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const handleSelect = (token: string) => {
    setSelectedToken(token);
    onTokenSelect(token);
  };
  return (
    <div className="space-y-6">
      {Object.entries(groupedTokens).map(([groupName, tokens]) => (
        <TokenGroup
          key={groupName}
          name={groupName}
          tokens={tokens}
          overrides={overrides}
          handleOverrideChange={handleOverrideChange}
          handleReset={handleReset}
          handleGroupReset={handleGroupReset}
          overrideRefs={overrideRefs}
          mergedTokens={mergedTokens}
          textTokenKeys={textTokenKeys}
          bgTokenKeys={bgTokenKeys}
          handleWarningChange={handleWarningChange}
          onTokenSelect={handleSelect}
          selectedToken={selectedToken}
        />
      ))}
    </div>
  );
}
