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
  onOpenGlobalSections: () => void;
  onOpenAppMarket: () => void;
  onOpenCMS: () => void;
  onOpenCode: () => void;
  onToggleInspector: () => void;
  isAddActive?: boolean;
  isLayersActive?: boolean;
  isInspectorActive?: boolean;
}

// Minimal left icon rail. Uses simple glyphs; replace with line icons later.
export default function LeftRail({ onOpenAdd, onOpenLayers, onOpenPages, onOpenSiteStyles, onOpenGlobalSections, onOpenAppMarket, onOpenCMS, onOpenCode, onToggleInspector, isAddActive = false, isLayersActive = false, isInspectorActive = false }: Props) {
  const Item = ({ label, onClick, icon, active = false }: { label: string; onClick: () => void; icon: React.ReactNode; active?: boolean }) => (
    <Tooltip text={label}>
      <button
        type="button"
        className={`h-10 w-10 rounded-md border ${active ? 'bg-primary/10 border-primary ring-1 ring-primary/30' : 'bg-surface-2'} hover:bg-surface-3`}
        aria-label={label}
        onClick={onClick}
        title={label}
        aria-pressed={active}
      >
        <span aria-hidden className="flex items-center justify-center text-foreground">
          {icon}
        </span>
      </button>
    </Tooltip>
  );

  return (
    <aside className="ml-[25px] flex w-16 shrink-0 flex-col items-center gap-4 border-r bg-surface-1/80 py-4">
      <Item label="Add Elements" onClick={onOpenAdd} icon={<PlusIcon className="h-5 w-5" />} active={isAddActive} />
      <Item label="Layers" onClick={onOpenLayers} icon={<LayersIcon className="h-5 w-5" />} active={isLayersActive} />
      <Item label="Pages" onClick={onOpenPages} icon={<ReaderIcon className="h-5 w-5" />} />
      <Item label="Global Sections" onClick={onOpenGlobalSections} icon={<SectionIcon className="h-5 w-5" />} />
      <Item label="Site Styles" onClick={onOpenSiteStyles} icon={<TokensIcon className="h-5 w-5" />} />
      <Item label="App Market" onClick={onOpenAppMarket} icon={<ViewGridIcon className="h-5 w-5" />} />
      <Item label="CMS" onClick={onOpenCMS} icon={<TableIcon className="h-5 w-5" />} />
      <Item label="Code" onClick={onOpenCode} icon={<CodeIcon className="h-5 w-5" />} />
      <div className="mt-auto" />
      <Item label="Toggle Inspector" onClick={onToggleInspector} icon={<ChevronRightIcon className="h-5 w-5" />} active={isInspectorActive} />
    </aside>
  );
}
