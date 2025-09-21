"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Button as MenuButton } from "../../atoms/shadcn";
import type { Action } from "./state";

type Props = {
  componentId: string;
  currentZ?: number | undefined;
  dispatch: React.Dispatch<Action>;
};

export default function ZIndexMenu({ componentId, currentZ, dispatch }: Props) {
  return (
    <div className="absolute top-1 right-10 z-30">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <MenuButton type="button" variant="outline" className="h-6 px-2 py-1 text-xs">⋯</MenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); dispatch({ type: "update-editor", id: componentId, patch: { zIndex: 999 } as any }); }}>Bring to front</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); dispatch({ type: "update-editor", id: componentId, patch: { zIndex: 0 } as any }); }}>Send to back</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const z = (currentZ as number | undefined) ?? 0; dispatch({ type: "update-editor", id: componentId, patch: { zIndex: z + 1 } as any }); }}>Forward</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const z = (currentZ as number | undefined) ?? 0; dispatch({ type: "update-editor", id: componentId, patch: { zIndex: Math.max(0, z - 1) } as any }); }}>Backward</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

