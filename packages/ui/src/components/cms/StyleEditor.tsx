// packages/ui/components/cms/StyleEditor.tsx
"use client";

import type { TokenMap } from "../../hooks/useTokenEditor";
import Presets from "./style/Presets";
import Tokens from "./style/Tokens";

interface StyleEditorProps {
  tokens: TokenMap;
  baseTokens: TokenMap;
  onChange: (tokens: TokenMap) => void;
  /** Token key to focus when editor opens */
  focusToken?: string | null;
  /** Hide token search input */
  showSearch?: boolean;
  /** Hide eyedropper and advanced actions */
  showExtras?: boolean;
}

export default function StyleEditor(props: StyleEditorProps) {
  return (
    <div className="space-y-4">
      <Presets {...props} />
      <Tokens {...props} showSearch={props.showSearch} showExtras={props.showExtras} />
    </div>
  );
}
