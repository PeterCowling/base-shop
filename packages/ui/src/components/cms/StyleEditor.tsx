// packages/ui/components/cms/StyleEditor.tsx
"use client";

import type { TokenMap } from "@ui/hooks/useTokenEditor";
import Presets from "./style/Presets";
import Tokens from "./style/Tokens";

interface StyleEditorProps {
  tokens: TokenMap;
  baseTokens: TokenMap;
  onChange: (tokens: TokenMap) => void;
  /** Token key to focus when editor opens */
  focusToken?: string | null;
}

export default function StyleEditor(props: StyleEditorProps) {
  return (
    <div className="space-y-4">
      <Presets {...props} />
      <Tokens {...props} />
    </div>
  );
}

