"use client";

import { Button } from "../../../atoms/shadcn";
import type { PresencePeer } from "../collab/usePresence";

export function CommentsToolbar(props: {
  peers: PresencePeer[];
  showResolved: boolean;
  onShowResolvedChange: (v: boolean) => void;
  onReload: () => void | Promise<void>;
  onAddForSelected: () => void | Promise<void>;
  canAddForSelected: boolean;
  onToggleDrawer: () => void;
  unresolvedCount: number;
}) {
  const { peers, showResolved, onShowResolvedChange, onReload, onAddForSelected, canAddForSelected, onToggleDrawer, unresolvedCount } = props;
  return (
    <div className="pointer-events-auto absolute right-2 top-2 flex items-center gap-2 rounded bg-muted/60 px-2 py-1 text-xs">
      <div className="flex items-center gap-1 pr-1 border-r">
        {peers.slice(0, 3).map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1 rounded px-1 py-0.5" title={`${p.label} online`} style={{ backgroundColor: `${p.color}20`, color: "inherit" }}>
            <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="max-w-[6rem] truncate">{p.label}</span>
          </span>
        ))}
        {peers.length > 3 && (
          <span className="text-muted-foreground">+{peers.length - 3} more</span>
        )}
      </div>
      <label className="flex items-center gap-1">
        <input type="checkbox" checked={showResolved} onChange={(e) => onShowResolvedChange(e.target.checked)} />
        Show resolved
      </label>
      <Button variant="outline" onClick={() => void onReload()} className="h-6 px-2 py-0 text-xs">Reload</Button>
      <Button variant="outline" onClick={() => void onAddForSelected()} disabled={!canAddForSelected} className="h-6 px-2 py-0 text-xs">Add for selected</Button>
      <Button variant="default" onClick={onToggleDrawer} className="h-6 px-2 py-0 text-xs">
        Comments ({unresolvedCount})
      </Button>
    </div>
  );
}

export default CommentsToolbar;

