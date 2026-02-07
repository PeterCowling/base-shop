"use client";
// i18n-exempt — editor-only Pages panel; copy pending i18n wiring

import React, { useMemo } from "react";

import { OverlayScrim } from "../../../atoms";
import { Drawer, DrawerContent, DrawerDescription, DrawerPortal,DrawerTitle } from "../../../atoms/primitives/drawer";
import { Sidebar } from "../../../atoms/primitives/Sidebar";
import { Stack } from "../../../atoms/primitives/Stack";

import { PageSettings } from "./PageSettings";
import { PagesList } from "./PagesList";
import { usePagesState } from "./usePagesState";
import { deriveShopFromPath } from "./utils";

/* i18n-exempt */
const t = (s: string) => s;

export default function PagesPanel({ open, onOpenChange, shop: shopProp = null }: { open: boolean; onOpenChange: (v: boolean) => void; shop?: string | null }) {
  const shop = useMemo(() => shopProp ?? deriveShopFromPath() ?? "", [shopProp]);
  const state = usePagesState(open, shop);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent side="left" width="w-[42rem]" className="flex h-full flex-col p-0">
          <div className="flex-none px-4 py-3">
            <DrawerTitle>{t("Pages")}</DrawerTitle>
            <DrawerDescription className="sr-only">
              {t("Manage the site pages list and configure the selected page.")}
            </DrawerDescription>
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
