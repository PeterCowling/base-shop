import { useCallback } from "react";
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
import type { BlockDimensions, HandleResize, UpdateComponent } from "./types";

interface SingleSelectionAlignmentControlsProps {
  selectedIds: string[];
  dims: BlockDimensions;
  handleChange: UpdateComponent;
  handleResize: HandleResize;
  centerInParentX: () => void;
  centerInParentY: () => void;
}

const SingleSelectionAlignmentControls = ({
  selectedIds,
  dims,
  handleChange,
  handleResize,
  centerInParentX,
  centerInParentY,
}: SingleSelectionAlignmentControlsProps) => {
  const selectedId = selectedIds[0];

  const withElement = useCallback(
    (handler: (element: HTMLElement, parent: HTMLElement) => void) => () => {
      if (!selectedId) return;
      try {
        const el = document.querySelector(`[data-component-id="${selectedId}"]`) as HTMLElement | null;
        const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
        if (!el || !parent) return;
        handler(el, parent);
      } catch {
        // no-op
      }
    },
    [selectedId],
  );

  if (selectedIds.length !== 1 || !selectedId) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Align to parent left"
        onClick={withElement((el, parent) => {
          const rect = el.getBoundingClientRect();
          const pRect = parent.getBoundingClientRect();
          const left = Math.round(rect.left - pRect.left);
          handleChange({ dockX: "left" } as unknown as UpdateComponent extends (p: infer P) => void ? P : never);
          handleResize({ [dims.leftKey]: `${left}px`, right: undefined });
        })}
      >
        <AlignLeftIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Align to parent right"
        onClick={withElement((el, parent) => {
          const rect = el.getBoundingClientRect();
          const pRect = parent.getBoundingClientRect();
          const right = Math.round(pRect.right - rect.right);
          handleChange({ dockX: "right" } as unknown as UpdateComponent extends (p: infer P) => void ? P : never);
          handleResize({ right: `${right}px`, [dims.leftKey]: "" });
        })}
      >
        <AlignRightIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Align to parent top"
        onClick={withElement((el, parent) => {
          const rect = el.getBoundingClientRect();
          const pRect = parent.getBoundingClientRect();
          const top = Math.round(rect.top - pRect.top);
          handleChange({ dockY: "top" } as unknown as UpdateComponent extends (p: infer P) => void ? P : never);
          handleResize({ [dims.topKey]: `${top}px`, bottom: "" });
        })}
      >
        <AlignTopIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Align to parent bottom"
        onClick={withElement((el, parent) => {
          const rect = el.getBoundingClientRect();
          const pRect = parent.getBoundingClientRect();
          const bottom = Math.round(pRect.bottom - rect.bottom);
          handleChange({ dockY: "bottom" } as unknown as UpdateComponent extends (p: infer P) => void ? P : never);
          handleResize({ bottom: `${bottom}px`, [dims.topKey]: "" });
        })}
      >
        <AlignBottomIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Center Horizontally in parent"
        onClick={centerInParentX}
      >
        <AlignCenterHorizontallyIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Center Vertically in parent"
        onClick={centerInParentY}
      >
        <AlignCenterVerticallyIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Stretch horizontally"
        onClick={withElement((el, parent) => {
          const rect = el.getBoundingClientRect();
          const pRect = parent.getBoundingClientRect();
          const left = Math.round(rect.left - pRect.left);
          const right = Math.round(pRect.right - rect.right);
          handleChange({ dockX: "left" } as unknown as UpdateComponent extends (p: infer P) => void ? P : never);
          handleResize({ [dims.leftKey]: `${left}px`, right: `${right}px`, width: "" });
        })}
      >
        <ColumnSpacingIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Stretch vertically"
        onClick={withElement((el, parent) => {
          const rect = el.getBoundingClientRect();
          const pRect = parent.getBoundingClientRect();
          const top = Math.round(rect.top - pRect.top);
          const bottom = Math.round(pRect.bottom - rect.bottom);
          handleChange({ dockY: "top" } as unknown as UpdateComponent extends (p: infer P) => void ? P : never);
          handleResize({ [dims.topKey]: `${top}px`, bottom: `${bottom}px`, height: "" });
        })}
      >
        <RowSpacingIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SingleSelectionAlignmentControls;
