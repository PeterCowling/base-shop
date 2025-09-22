"use client";

import React from "react";
import { Tooltip } from "../../atoms";
import {
  PlusIcon,
  LayersIcon,
  ReaderIcon,
  SectionIcon,
  TokensIcon,
  ViewGridIcon,
  TableIcon,
  CodeIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@radix-ui/react-icons";

interface Props {
  onOpenAdd: () => void;
  onOpenLayers: () => void;
  onOpenPages: () => void;
  onOpenSiteStyles: () => void;
  onOpenAppMarket: () => void;
  onToggleInspector: () => void;
}

// Minimal left icon rail. Uses simple glyphs; replace with line icons later.
export default function LeftRail({ onOpenAdd, onOpenLayers, onOpenPages, onOpenSiteStyles, onOpenAppMarket, onToggleInspector }: Props) {
  const Item = ({ label, onClick, icon }: { label: string; onClick: () => void; icon: React.ReactNode }) => (
    <Tooltip text={label}>
      <button
        type="button"
        className="h-10 w-10 rounded-md border bg-surface-2 hover:bg-surface-3"
        aria-label={label}
        onClick={onClick}
        title={label}
      >
        <span aria-hidden className="flex items-center justify-center text-foreground">
          {icon}
        </span>
      </button>
    </Tooltip>
  );

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-3 border-r bg-surface-1/80 py-3">
      <Item label="Add Elements" onClick={onOpenAdd} icon={<PlusIcon className="h-5 w-5" />} />
      <Item label="Layers" onClick={onOpenLayers} icon={<LayersIcon className="h-5 w-5" />} />
      <Item label="Pages" onClick={onOpenPages} icon={<ReaderIcon className="h-5 w-5" />} />
      <Item label="Global Sections" onClick={() => alert("Global Sections are page-level in this editor (scoped to the current page). A dedicated panel is coming soon.")} icon={<SectionIcon className="h-5 w-5" />} />
      <Item label="Site Styles" onClick={onOpenSiteStyles} icon={<TokensIcon className="h-5 w-5" />} />
      <Item label="App Market" onClick={onOpenAppMarket} icon={<ViewGridIcon className="h-5 w-5" />} />
      <Item label="CMS" onClick={() => alert("CMS connections panel is coming soon.")} icon={<TableIcon className="h-5 w-5" />} />
      <Item label="Code" onClick={() => alert("Code panel is coming soon.")} icon={<CodeIcon className="h-5 w-5" />} />
      <div className="mt-auto" />
      <Item label="Toggle Inspector" onClick={onToggleInspector} icon={<ChevronRightIcon className="h-5 w-5" />} />
    </aside>
  );
}
