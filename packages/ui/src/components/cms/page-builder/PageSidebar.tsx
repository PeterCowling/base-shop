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
  if (!selectedId) return null;

  const handleChange = useCallback(
    (patch: Partial<PageComponent>) =>
      dispatch({ type: "update", id: selectedId, patch }),
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
      dispatch({ type: "resize", id: selectedId, ...size }),
    [dispatch, selectedId],
  );

  const handleDuplicate = useCallback(() => {
    dispatch({ type: "duplicate", id: selectedId });
  }, [dispatch, selectedId]);

  return (
    <aside className="w-72 shrink-0 space-y-2">
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
