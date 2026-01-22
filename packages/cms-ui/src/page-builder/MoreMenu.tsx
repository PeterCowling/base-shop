// packages/ui/src/components/cms/page-builder/MoreMenu.tsx
"use client";

import { Popover, PopoverContent, PopoverTrigger, Tooltip } from "@acme/design-system/atoms";
import { Stack } from "@acme/design-system/primitives/Stack";
import { Button } from "@acme/design-system/shadcn";

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
          <Button variant="outline" className="h-10 w-10 rounded-md" aria-label="More actions">⋯</Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-56 p-2">
        <Stack gap={2}>
          {items.length > 0 && (
            <Stack gap={1}>
              {items.map((i) => (
                <Button key={i.label} variant="ghost" className="justify-start" onClick={i.onClick}>
                  {i.label}
                </Button>
              ))}
            </Stack>
          )}
          {content && <div>{content}</div>}
        </Stack>
      </PopoverContent>
    </Popover>
  );
}
