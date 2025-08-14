// packages/ui/src/components/cms/style/Presets.tsx
"use client";

import type { TokenMap } from "@ui/hooks/useTokenEditor";
import { ReactElement } from "react";

interface PresetsProps {
  tokens: TokenMap;
  baseTokens: TokenMap;
  onChange: (tokens: TokenMap) => void;
}

export default function Presets(_: PresetsProps): ReactElement {
  return (
    <p className="text-sm text-muted" data-testid="presets-placeholder">
      No presets available
    </p>
  );
}

