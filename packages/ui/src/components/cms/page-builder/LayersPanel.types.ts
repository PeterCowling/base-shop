import type { HistoryState,PageComponent } from "@acme/types";

import type { Action } from "./state";

export interface LayersPanelProps {
  components: PageComponent[];
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  dispatch: (action: Action) => void;
  editor?: HistoryState["editor"];
  viewport?: "desktop" | "tablet" | "mobile";
  crossNotices?: boolean;
}

export type LayerNode = PageComponent & {
  children?: PageComponent[];
  name?: string;
  hidden?: boolean;
  locked?: boolean;
  __isGlobal?: boolean;
  __hasOverride?: boolean;
};

