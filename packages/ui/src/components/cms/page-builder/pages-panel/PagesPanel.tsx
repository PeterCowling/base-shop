"use client";
// i18n-exempt — editor-only Pages panel; copy pending i18n wiring

import React, { useMemo } from "react";
import { Drawer, DrawerContent, DrawerTitle, DrawerPortal } from "../../../atoms/primitives/drawer";
import { OverlayScrim } from "../../../atoms";
import { Sidebar } from "../../../atoms/primitives/Sidebar";
import { Stack } from "../../../atoms/primitives/Stack";
import { deriveShopFromPath } from "./utils";
import { usePagesState } from "./usePagesState";
import { PagesList } from "./PagesList";
import { PageSettings } from "./PageSettings";

export default function PagesPanel({ open, onOpenChange, shop: shopProp = null }: { open: boolean; onOpenChange: (v: boolean) => void; shop?: string | null }) {
  const shop = useMemo(() => shopProp ?? deriveShopFromPath() ?? "", [shopProp]);
  const state = usePagesState(open, shop);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent side="left" width="w-[42rem]" className="flex h-full flex-col p-0">
          <div className="flex-none px-4 py-3">
            <DrawerTitle>Pages</DrawerTitle>
          </div>
          <Sidebar sideWidth="w-72" gap={0} className="flex-1 min-h-0">
            <PagesList
              query={state.q}
              setQuery={state.setQ}
              filtered={state.filtered}
              selectedId={state.selectedId}
              onSelect={state.setSelectedId}
              onMove={state.move}
              onToggleVisibility={state.toggleVisibility}
              onAdd={state.addPage}
              orderDirty={state.orderDirty}
              onSaveOrder={state.saveOrder}
              onSaveDraft={state.saveDraft}
            />
            <Stack className="h-full p-3" gap={3}>
              <PageSettings selected={state.selected} updateSelected={state.updateSelected} />
            </Stack>
          </Sidebar>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
