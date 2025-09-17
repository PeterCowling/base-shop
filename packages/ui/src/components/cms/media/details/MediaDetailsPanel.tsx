// packages/ui/src/components/cms/media/details/MediaDetailsPanel.tsx
"use client";

import type { ReactElement } from "react";

import BaseMediaDetailsPanel, {
  type MediaDetailsFormValues,
  type MediaDetailsPanelProps as BaseMediaDetailsPanelProps,
} from "../MediaDetailsPanel";

export interface MediaDetailsPanelProps
  extends Omit<BaseMediaDetailsPanelProps, "pending"> {
  loading: BaseMediaDetailsPanelProps["pending"];
}

export default function MediaDetailsPanel({
  loading,
  ...props
}: MediaDetailsPanelProps): ReactElement {
  return <BaseMediaDetailsPanel pending={loading} {...props} />;
}

export { MediaDetailsPanel };
export type { MediaDetailsFormValues };
