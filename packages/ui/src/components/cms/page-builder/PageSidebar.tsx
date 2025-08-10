import ComponentEditor from "./ComponentEditor";
import type { PageComponent } from "@types";
import type { Action } from "./state";
import { useCallback } from "react";

interface Props {
  components: PageComponent[];
  selectedId: string | null;
  dispatch: (action: Action) => void;
}

const PageSidebar = ({ components, selectedId, dispatch }: Props) => {
  if (!selectedId) return null;

  const handleChange = useCallback(
    (patch: Partial<PageComponent>) =>
      dispatch({ type: "update", id: selectedId, patch }),
    [dispatch, selectedId],
  );

  const handleResize = useCallback(
    (size: { width?: string; height?: string; top?: string; left?: string }) =>
      dispatch({ type: "resize", id: selectedId, ...size }),
    [dispatch, selectedId],
  );

  return (
    <aside className="w-72 shrink-0">
      <ComponentEditor
        component={components.find((c) => c.id === selectedId)!}
        onChange={handleChange}
        onResize={handleResize}
      />
    </aside>
  );
};

export default PageSidebar;
