// packages/ui/src/components/cms/page-builder/ViewMenu.tsx
"use client";

import { Button, Popover, PopoverContent, PopoverTrigger, Switch, Tooltip } from "../../atoms";

interface Props {
  showPreview: boolean;
  togglePreview: () => void;
  showComments: boolean;
  toggleComments: () => void;
  startTour: () => void;
  showPalette?: boolean;
  togglePalette?: () => void;
}

export function ViewMenuContent({ showPreview, togglePreview, showComments, toggleComments, startTour, showPalette, togglePalette }: Props) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">View</div>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Preview</span>
        <Switch checked={showPreview} onChange={togglePreview} />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Comments</span>
        <Switch checked={showComments} onChange={toggleComments} />
      </label>
      {typeof showPalette === "boolean" && togglePalette && (
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>Palette</span>
          <Switch checked={showPalette} onChange={togglePalette} />
        </label>
      )}
      <div className="pt-1">
        <Button variant="outline" className="w-full" onClick={startTour}>
          Start tour
        </Button>
      </div>
    </div>
  );
}

export default function ViewMenu(props: Props) {
  return (
    <Popover>
      <Tooltip text="View options">
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label="View options">View</Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-64">
        <ViewMenuContent {...props} />
      </PopoverContent>
    </Popover>
  );
}
