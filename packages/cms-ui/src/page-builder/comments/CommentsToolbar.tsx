"use client";

import { useTranslations } from "@acme/i18n";

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/design-system/shadcn";
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
  const t = useTranslations();
  return (
    <div className="relative pointer-events-none">
      <div className="pointer-events-auto absolute end-2 top-2 flex items-center gap-1 rounded bg-muted/60 px-1.5 py-1 text-xs shadow-sm opacity-80 hover:opacity-100">
        <Button variant="default" onClick={onToggleDrawer} className="h-6 px-2 py-0 text-xs">
          {t("comments.label")} ({unresolvedCount})
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-6 px-2 py-0 text-xs" aria-label={t("comments.optionsAria") as string}>
              •••
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56 text-xs" container={portalContainer}>
            <DropdownMenuLabel>{t("comments.label")}</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={!!showResolved}
              onCheckedChange={(v) => onShowResolvedChange(Boolean(v))}
            >
              {t("comments.showResolvedPins")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuItem onClick={() => void onReload()}>{t("common.reload")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void onAddForSelected()} disabled={!canAddForSelected}>
              {t("comments.addForSelected")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("comments.online")}</DropdownMenuLabel>
            {peers.length === 0 && (
              <DropdownMenuItem disabled className="text-muted-foreground">{t("comments.noneOnline")}</DropdownMenuItem>
            )}
            {peers.slice(0, 6).map((p) => (
              <DropdownMenuItem key={p.id} disabled className="gap-2">
                {/* eslint-disable-next-line react/forbid-dom-props -- LINT-0000: dynamic peer color badge */}
                <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="truncate">{p.label}</span>
              </DropdownMenuItem>
            ))}
            {peers.length > 6 && (
              <DropdownMenuItem disabled className="text-muted-foreground">+{peers.length - 6} {t("common.more")}</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default CommentsToolbar;
