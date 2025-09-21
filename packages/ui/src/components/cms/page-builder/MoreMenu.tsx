// packages/ui/src/components/cms/page-builder/MoreMenu.tsx
"use client";

import { Button, Popover, PopoverContent, PopoverTrigger, Tooltip } from "../../atoms";

interface Item {
  label: string;
  onClick: () => void;
}

interface Props {
  items?: Item[];
  content?: React.ReactNode;
}

export default function MoreMenu({ items = [], content }: Props) {
  return (
    <Popover>
      <Tooltip text="More actions">
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label="More actions">⋯</Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-56 p-2">
        <div className="flex flex-col gap-2">
          {items.length > 0 && (
            <div className="flex flex-col gap-1">
              {items.map((i) => (
                <Button key={i.label} variant="ghost" className="justify-start" onClick={i.onClick}>
                  {i.label}
                </Button>
              ))}
            </div>
          )}
          {content && <div>{content}</div>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
