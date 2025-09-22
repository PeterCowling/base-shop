"use client";

import React from "react";
import { Tooltip } from "../../atoms";

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
  const Item = ({ label, onClick, glyph }: { label: string; onClick: () => void; glyph: string }) => (
    <Tooltip text={label}>
      <button
        type="button"
        className="h-9 w-9 rounded-md border bg-surface-2 text-sm hover:bg-surface-3"
        aria-label={label}
        onClick={onClick}
        title={label}
      >
        <span aria-hidden>{glyph}</span>
      </button>
    </Tooltip>
  );

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-2 border-r bg-surface-1/80 py-2">
      <Item label="Add Elements" glyph="+" onClick={onOpenAdd} />
      <Item label="Layers" glyph="≡" onClick={onOpenLayers} />
      <Item label="Pages" glyph="📄" onClick={onOpenPages} />
      <Item label="Global Sections" glyph="◫" onClick={() => alert("Global Sections are page-level in this editor (scoped to the current page). A dedicated panel is coming soon.")} />
      <Item label="Site Styles" glyph="A" onClick={onOpenSiteStyles} />
      <Item label="App Market" glyph="🛒" onClick={onOpenAppMarket} />
      <Item label="CMS" glyph="🗂" onClick={() => alert("CMS connections panel is coming soon.")} />
      <Item label="Code" glyph="{}" onClick={() => alert("Code panel is coming soon.")} />
      <div className="mt-auto" />
      <Item label="Toggle Inspector" glyph=">" onClick={onToggleInspector} />
    </aside>
  );
}

