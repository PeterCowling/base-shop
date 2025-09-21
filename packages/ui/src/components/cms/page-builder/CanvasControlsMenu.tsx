// packages/ui/src/components/cms/page-builder/CanvasControlsMenu.tsx
"use client";

import { Button, Popover, PopoverContent, PopoverTrigger, Tooltip } from "../../atoms";
import GridSettings from "./GridSettings";

interface Props {
  gridProps: React.ComponentProps<typeof GridSettings>;
}

// Compact menu wrapper that tucks the verbose GridSettings into a popover.
export default function CanvasControlsMenu({ gridProps }: Props) {
  return (
    <Popover>
      <Tooltip text="Canvas settings">
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label="Canvas settings">
            Canvas
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-[520px]">
        <div className="space-y-3">
          <div className="text-sm font-medium">Canvas</div>
          <GridSettings {...gridProps} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
