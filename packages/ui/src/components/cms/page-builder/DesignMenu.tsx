// packages/ui/src/components/cms/page-builder/DesignMenu.tsx
"use client";

import { Button, Dialog, DialogTrigger } from "../../atoms/shadcn";
import { Popover, PopoverContent, PopoverTrigger, Tooltip } from "../../atoms";
import ThemePanel from "./ThemePanel";
import BreakpointsPanel, { type Breakpoint } from "./panels/BreakpointsPanel";

interface Props {
  breakpoints?: Breakpoint[];
  onChangeBreakpoints?: (list: Breakpoint[]) => void;
}

export default function DesignMenu({ breakpoints = [], onChangeBreakpoints }: Props) {
  return (
    <Popover>
      <Tooltip text="Design options">
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label="Design options">Design</Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-2 text-sm">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Theme…</Button>
            </DialogTrigger>
            <ThemePanel />
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Breakpoints…</Button>
            </DialogTrigger>
            <BreakpointsPanel breakpoints={breakpoints} onChange={(list) => onChangeBreakpoints?.(list)} />
          </Dialog>
        </div>
      </PopoverContent>
    </Popover>
  );
}
