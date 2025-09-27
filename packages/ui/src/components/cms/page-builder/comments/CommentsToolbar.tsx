"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../atoms/shadcn";
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
  const portalContainer = typeof document !== "undefined" ? (document.querySelector('[data-pb-portal-root]') as HTMLElement | null) : null;
  return (
    <div className="pointer-events-auto absolute end-2 top-2 flex items-center gap-1 rounded bg-muted/60 px-1.5 py-1 text-xs shadow-sm opacity-80 hover:opacity-100">
      <Button variant="default" onClick={onToggleDrawer} className="h-6 px-2 py-0 text-xs">
        Comments ({unresolvedCount})
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-6 px-2 py-0 text-xs" aria-label="Comments options">
            •••
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[14rem] text-xs" container={portalContainer}>
          <DropdownMenuLabel>Comments</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={!!showResolved}
            onCheckedChange={(v) => onShowResolvedChange(Boolean(v))}
          >
            Show resolved pins
          </DropdownMenuCheckboxItem>
          <DropdownMenuItem onClick={() => void onReload()}>Reload</DropdownMenuItem>
          <DropdownMenuItem onClick={() => void onAddForSelected()} disabled={!canAddForSelected}>
            Add for selected
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Online</DropdownMenuLabel>
          {peers.length === 0 && (
            <DropdownMenuItem disabled className="text-muted-foreground">No one else online</DropdownMenuItem>
          )}
          {peers.slice(0, 6).map((p) => (
            <DropdownMenuItem key={p.id} disabled className="gap-2">
              <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="truncate">{p.label}</span>
            </DropdownMenuItem>
          ))}
          {peers.length > 6 && (
            <DropdownMenuItem disabled className="text-muted-foreground">+{peers.length - 6} more</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default CommentsToolbar;
