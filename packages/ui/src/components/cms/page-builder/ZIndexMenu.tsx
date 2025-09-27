/* eslint-disable ds/absolute-parent-guard -- PB-0001: menu trigger is absolutely positioned within the editor canvas; the positioned ancestor lives in BlockItem */
"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Button as MenuButton } from "../../atoms/shadcn";
import { Tooltip } from "../../atoms";
import type { Action } from "./state";

type Props = {
  componentId: string;
  currentZ?: number | undefined;
  dispatch: React.Dispatch<Action>;
};

type EditorPatch = Extract<Action, { type: "update-editor" }>["patch"];

export default function ZIndexMenu({ componentId, currentZ, dispatch }: Props) {
  return (
    <div className="absolute top-1 end-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Tooltip text={"Layer order" /* i18n-exempt: builder control label */}>
            <MenuButton type="button" variant="outline" className="h-6 px-2 py-1 text-xs" aria-label="Layer order">⋯</MenuButton>
          </Tooltip>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const patch: EditorPatch = { zIndex: 999 }; dispatch({ type: "update-editor", id: componentId, patch }); }}>{"Bring to front" /* i18n-exempt: builder action */}</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const patch: EditorPatch = { zIndex: 0 }; dispatch({ type: "update-editor", id: componentId, patch }); }}>{"Send to back" /* i18n-exempt: builder action */}</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const z = currentZ ?? 0; const patch: EditorPatch = { zIndex: z + 1 }; dispatch({ type: "update-editor", id: componentId, patch }); }}>{"Forward" /* i18n-exempt: builder action */}</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const z = currentZ ?? 0; const patch: EditorPatch = { zIndex: Math.max(0, z - 1) }; dispatch({ type: "update-editor", id: componentId, patch }); }}>{"Backward" /* i18n-exempt: builder action */}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
