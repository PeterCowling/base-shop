import {
  AlignBottomIcon,
  AlignCenterHorizontallyIcon,
  AlignCenterVerticallyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  ColumnSpacingIcon,
  RowSpacingIcon,
} from "@radix-ui/react-icons";

import { Button } from "@acme/design-system/shadcn";
import type { PageComponent } from "@acme/types";

import {
  alignBottom,
  alignCenterX,
  alignCenterY,
  alignLeft,
  alignRight,
  alignTop,
  distributeHorizontal,
  distributeVertical,
} from "../../state/layout/geometry";

import type { PageBuilderDispatch, Viewport } from "./types";

interface MultiSelectionAlignmentControlsProps {
  components: PageComponent[];
  selectedIds: string[];
  viewport: Viewport;
  dispatch: PageBuilderDispatch;
}

const MultiSelectionAlignmentControls = ({
  components,
  selectedIds,
  viewport,
  dispatch,
}: MultiSelectionAlignmentControlsProps) => {
  if (selectedIds.length <= 1) return null;

  const viewportSuffix = viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile";
  const leftKey = `left${viewportSuffix}`;
  const topKey = `top${viewportSuffix}`;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Align Left"
        onClick={() =>
          alignLeft(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [leftKey]: p.left }),
          )
        }
      >
        <AlignLeftIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Align Right"
        onClick={() =>
          alignRight(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [leftKey]: p.left }),
          )
        }
      >
        <AlignRightIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Align Top"
        onClick={() =>
          alignTop(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [topKey]: p.top }),
          )
        }
      >
        <AlignTopIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Align Bottom"
        onClick={() =>
          alignBottom(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [topKey]: p.top }),
          )
        }
      >
        <AlignBottomIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Center Horizontally"
        onClick={() =>
          alignCenterX(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [leftKey]: p.left }),
          )
        }
      >
        <AlignCenterHorizontallyIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Center Vertically"
        onClick={() =>
          alignCenterY(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [topKey]: p.top }),
          )
        }
      >
        <AlignCenterVerticallyIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Distribute Horizontally"
        onClick={() =>
          distributeHorizontal(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [leftKey]: p.left }),
          )
        }
      >
        <ColumnSpacingIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Distribute Vertically"
        onClick={() =>
          distributeVertical(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [topKey]: p.top }),
          )
        }
      >
        <RowSpacingIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MultiSelectionAlignmentControls;
