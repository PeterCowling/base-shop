// packages/ui/src/components/cms/page-builder/panels/InteractionsPanel.tsx
"use client";

import type { PageComponent } from "@acme/types";

interface Props {
  component: PageComponent;
}

export default function InteractionsPanel(_: Props) {
  return <p className="text-muted text-sm">No interactions available</p>;
}

