import type { ReactElement } from "react";

import type {
  MediaDetailsFormValues,
  MediaDetailsPanelProps as BaseMediaDetailsPanelProps,
} from "../MediaDetailsPanel";

export interface MediaDetailsPanelProps
  extends Omit<BaseMediaDetailsPanelProps, "pending"> {
  loading: BaseMediaDetailsPanelProps["pending"];
}

export default function MediaDetailsPanel(props: MediaDetailsPanelProps): ReactElement;
export { MediaDetailsPanel };
export type { MediaDetailsFormValues };
