import ComponentEditor from "./ComponentEditor";
import type { PageComponent } from "@types";
import type { Action } from "./state";

interface Props {
  components: PageComponent[];
  selectedId: string | null;
  dispatch: (action: Action) => void;
}

const PageSidebar = ({ components, selectedId, dispatch }: Props) => {
  if (!selectedId) return null;
  return (
    <aside className="w-72 shrink-0">
      <ComponentEditor
        component={components.find((c) => c.id === selectedId)!}
        onChange={(patch) =>
          dispatch({ type: "update", id: selectedId, patch })
        }
        onResize={(size) =>
          dispatch({ type: "resize", id: selectedId, ...size })
        }
      />
    </aside>
  );
};

export default PageSidebar;
