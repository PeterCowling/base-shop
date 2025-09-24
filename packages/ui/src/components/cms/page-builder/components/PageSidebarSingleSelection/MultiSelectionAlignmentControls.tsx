import {
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignBottomIcon,
  AlignCenterHorizontallyIcon,
  AlignCenterVerticallyIcon,
  ColumnSpacingIcon,
  RowSpacingIcon,
} from "@radix-ui/react-icons";

import { Button } from "../../../../atoms/shadcn";
import {
  alignLeft,
  alignRight,
  alignTop,
  alignBottom,
  alignCenterX,
  alignCenterY,
  distributeHorizontal,
  distributeVertical,
} from "../../state/layout/geometry";
import type { PageComponent } from "@acme/types";
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
        className="h-7 px-2"
        title="Align Left"
        onClick={() =>
          alignLeft(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any),
          )
        }
      >
        <AlignLeftIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-7 px-2"
        title="Align Right"
        onClick={() =>
          alignRight(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any),
          )
        }
      >
        <AlignRightIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-7 px-2"
        title="Align Top"
        onClick={() =>
          alignTop(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any),
          )
        }
      >
        <AlignTopIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-7 px-2"
        title="Align Bottom"
        onClick={() =>
          alignBottom(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any),
          )
        }
      >
        <AlignBottomIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-7 px-2"
        title="Center Horizontally"
        onClick={() =>
          alignCenterX(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any),
          )
        }
      >
        <AlignCenterHorizontallyIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-7 px-2"
        title="Center Vertically"
        onClick={() =>
          alignCenterY(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any),
          )
        }
      >
        <AlignCenterVerticallyIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-7 px-2"
        title="Distribute Horizontally"
        onClick={() =>
          distributeHorizontal(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any),
          )
        }
      >
        <ColumnSpacingIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-7 px-2"
        title="Distribute Vertically"
        onClick={() =>
          distributeVertical(components, selectedIds, viewport).forEach((p) =>
            dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any),
          )
        }
      >
        <RowSpacingIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MultiSelectionAlignmentControls;
