import { Button } from "../../../../atoms/shadcn";
import UnitInput from "../../panels/layout/UnitInput";

import type { BlockDimensions, HandleResize } from "./types";

interface DimensionInputsProps {
  dims: BlockDimensions;
  selectedComponentId: string;
  handleResize: HandleResize;
}

const DimensionInputs = ({ dims, selectedComponentId, handleResize }: DimensionInputsProps) => (
  <div className="grid grid-cols-2 gap-2">
    <UnitInput
      componentId={selectedComponentId}
      label={<span className="text-xs">X (Left)</span>}
      value={dims.leftVal ?? ""}
      onChange={(v) => handleResize({ [dims.leftKey]: v })}
      axis="w"
      cssProp="left"
    />
    <UnitInput
      componentId={selectedComponentId}
      label={<span className="text-xs">Y (Top)</span>}
      value={dims.topVal ?? ""}
      onChange={(v) => handleResize({ [dims.topKey]: v })}
      axis="h"
      cssProp="top"
    />
    <UnitInput
      componentId={selectedComponentId}
      label={<span className="text-xs">W (Width)</span>}
      value={dims.widthVal ?? ""}
      onChange={(v) => handleResize({ [dims.widthKey]: v })}
      axis="w"
      cssProp="width"
    />
    <Button
      type="button"
      variant="outline"
      className="h-7 px-2 text-xs"
      aria-label="Set full width"
      title="Set full width (100%)"
      onClick={() => handleResize({ [dims.widthKey]: "100%" })}
    >
      Full W
    </Button>
    <UnitInput
      componentId={selectedComponentId}
      label={<span className="text-xs">H (Height)</span>}
      value={dims.heightVal ?? ""}
      onChange={(v) => handleResize({ [dims.heightKey]: v })}
      axis="h"
      cssProp="height"
    />
    <Button
      type="button"
      variant="outline"
      className="h-7 px-2 text-xs"
      aria-label="Set full height"
      title="Set full height (100%)"
      onClick={() => handleResize({ [dims.heightKey]: "100%" })}
    >
      Full H
    </Button>
  </div>
);

export default DimensionInputs;
