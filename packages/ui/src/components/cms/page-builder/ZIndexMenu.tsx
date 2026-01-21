/* eslint-disable ds/absolute-parent-guard -- PB-0001: menu trigger is absolutely positioned within the editor canvas; the positioned ancestor lives in BlockItem */
"use client";

import { useTranslations } from "@acme/i18n";

import { Tooltip } from "../../atoms";
import { Button as MenuButton,DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../atoms/shadcn";

import type { Action } from "./state";

type Props = {
  componentId: string;
  currentZ?: number | undefined;
  dispatch: React.Dispatch<Action>;
};

type EditorPatch = Extract<Action, { type: "update-editor" }>["patch"];

export default function ZIndexMenu({ componentId, currentZ, dispatch }: Props) {
  const t = useTranslations();
  return (
    <div className="absolute top-1 end-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Tooltip text={t("pb.menu.layerOrder") as string}>
            <MenuButton type="button" variant="outline" className="h-6 px-2 py-1 text-xs" aria-label={t("pb.menu.layerOrder") as string}>⋯</MenuButton>
          </Tooltip>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const patch: EditorPatch = { zIndex: 999 }; dispatch({ type: "update-editor", id: componentId, patch }); }}>{t("pb.menu.bringToFront") as string}</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const patch: EditorPatch = { zIndex: 0 }; dispatch({ type: "update-editor", id: componentId, patch }); }}>{t("pb.menu.sendToBack") as string}</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const z = currentZ ?? 0; const patch: EditorPatch = { zIndex: z + 1 }; dispatch({ type: "update-editor", id: componentId, patch }); }}>{t("pb.menu.forward") as string}</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const z = currentZ ?? 0; const patch: EditorPatch = { zIndex: Math.max(0, z - 1) }; dispatch({ type: "update-editor", id: componentId, patch }); }}>{t("pb.menu.backward") as string}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
