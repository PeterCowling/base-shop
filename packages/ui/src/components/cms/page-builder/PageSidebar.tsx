"use client";

import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "./state";
import { useMemo } from "react";
import { useTranslations } from "@acme/i18n";
import PageSidebarMultipleSelection from "./components/PageSidebarMultipleSelection";
import PageSidebarSingleSelection from "./components/PageSidebarSingleSelection";

interface Props {
  components: PageComponent[];
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  dispatch: (action: Action) => void;
  editor?: HistoryState["editor"];
  viewport?: "desktop" | "tablet" | "mobile";
  breakpoints?: { id: string; label: string; min?: number; max?: number }[];
  pageId?: string | null;
  crossNotices?: boolean;
}
const PageSidebar = ({ components, selectedIds, onSelectIds: _onSelectIds, dispatch, editor, viewport = "desktop", breakpoints = [], pageId = null, crossNotices: _crossNotices = true }: Props) => {
  const selectedComponent = useMemo(() => components.find((c) => c.id === selectedIds[0]) ?? null, [components, selectedIds]);
  const t = useTranslations();

  return (
    <aside className="w-80 shrink-0 space-y-4 p-2" data-tour="sidebar">

      {selectedIds.length === 0 && (
        <div className="p-2 text-sm text-muted-foreground">{t("cms.builder.sidebar.selectComponentHint")}</div>
      )}

      {selectedIds.length > 1 && (
        <PageSidebarMultipleSelection
          components={components}
          selectedIds={selectedIds}
          dispatch={dispatch}
          editor={editor}
          viewport={viewport}
        />
      )}

      {selectedIds.length >= 1 && selectedComponent && (
        <PageSidebarSingleSelection
          components={components}
          selectedIds={selectedIds}
          dispatch={dispatch}
          editor={editor}
          viewport={viewport}
          breakpoints={breakpoints}
          selectedComponent={selectedComponent}
          pageId={pageId}
        />
      )}
    </aside>
  );
};

export default PageSidebar;
