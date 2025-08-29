"use client";

import ComponentEditor from "./ComponentEditor";
import type { PageComponent } from "@acme/types";
import type { Action } from "./state";
import { useCallback } from "react";
import { Button } from "../../atoms/shadcn";

interface Props {
  components: PageComponent[];
  selectedId: string | null;
  dispatch: (action: Action) => void;
}

const PageSidebar = ({ components, selectedId, dispatch }: Props) => {
  const handleChange = useCallback(
    (patch: Partial<PageComponent>) =>
      selectedId && dispatch({ type: "update", id: selectedId, patch }),
    [dispatch, selectedId],
  );

  const handleResize = useCallback(
    (
      size: {
        width?: string;
        height?: string;
        top?: string;
        left?: string;
        widthDesktop?: string;
        widthTablet?: string;
        widthMobile?: string;
        heightDesktop?: string;
        heightTablet?: string;
        heightMobile?: string;
        marginDesktop?: string;
        marginTablet?: string;
        marginMobile?: string;
        paddingDesktop?: string;
        paddingTablet?: string;
        paddingMobile?: string;
      },
    ) =>
      selectedId && dispatch({ type: "resize", id: selectedId, ...size }),
    [dispatch, selectedId],
  );

  const handleDuplicate = useCallback(() => {
    if (selectedId) {
      dispatch({ type: "duplicate", id: selectedId });
    }
  }, [dispatch, selectedId]);

  if (!selectedId) {
    return (
      <aside
        className="w-72 shrink-0 p-4 text-sm text-muted-foreground"
        data-tour="sidebar"
      >
        Select a component to edit its properties.
      </aside>
    );
  }

  return (
    <aside className="w-72 shrink-0 space-y-2" data-tour="sidebar">
      <Button type="button" variant="outline" onClick={handleDuplicate}>
        Duplicate
      </Button>
      <ComponentEditor
        component={components.find((c) => c.id === selectedId)!}
        onChange={handleChange}
        onResize={handleResize}
      />
    </aside>
  );
};

export default PageSidebar;
