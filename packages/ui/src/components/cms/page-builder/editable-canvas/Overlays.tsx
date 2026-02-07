"use client";

import type { PresencePeer } from "../collab/usePresence";
import CommentsHelpLauncher from "../CommentsHelpLauncher";
import CommentsLayer from "../CommentsLayer";
import GridOverlay from "../GridOverlay";
import MultiSelectOverlay from "../MultiSelectOverlay";
import PeerSelectionsOverlay from "../PeerSelectionsOverlay";
import RulersOverlay from "../RulersOverlay";
import SelectionBreadcrumb from "../SelectionBreadcrumb";
import SnapLine from "../SnapLine";
import SoftLockBanner from "../SoftLockBanner";
import type { Rect } from "../utils/coords";

import type { Props, Viewport } from "./types";
import { t } from "./types";

export interface OverlaysProps {
  components: Props["components"];
  selectedIds: string[];
  onSelectIds: Props["onSelectIds"];
  canvasRef?: Props["canvasRef"];
  shop?: Props["shop"];
  pageId?: Props["pageId"];
  showComments: Props["showComments"];
  peers: PresencePeer[];
  positions: Record<string, Rect>;
  softLocksById: Map<string, PresencePeer>;
  dropRect: { left: number; top: number; width: number; height: number } | null;
  showRulers: Props["showRulers"];
  viewport: Viewport;
  ruler: {
    contentWidth: string | null;
    contentAlign?: "left" | "center" | "right";
    contentAlignBase?: "left" | "center" | "right";
    contentAlignSource?: "base" | "desktop" | "tablet" | "mobile";
  };
  unlockedIds: string[];
  hasLockedInSelection: boolean;
  gridCols: number;
  showGrid: boolean;
  snapEnabled?: boolean;
  zoom: number;
  snapPosition: number | null;
  marquee: {
    active: boolean;
    rect?: { left: number; top: number; width: number; height: number } | null;
  };
  showBaseline: boolean;
  baselineStep: number;
  onMultiSelectApply?: (patches: Record<string, Partial<{ left: string; top: string; width: string; height: string }>>) => void;
}

export default function Overlays(props: OverlaysProps) {
  const {
    components,
    selectedIds,
    onSelectIds,
    canvasRef,
    shop,
    pageId,
    showComments,
    peers,
    positions,
    softLocksById,
    dropRect,
    showRulers,
    viewport,
    ruler,
    unlockedIds,
    hasLockedInSelection,
    gridCols,
    showGrid,
    snapEnabled,
    zoom,
    snapPosition,
    marquee,
    showBaseline,
    baselineStep,
    onMultiSelectApply,
  } = props;

  return (
    <>
      <SelectionBreadcrumb components={components} selectedIds={selectedIds} onSelectIds={onSelectIds} />
      <CommentsHelpLauncher />
      {shop && pageId && showComments && (
        <CommentsLayer
          canvasRef={canvasRef ?? { current: null }}
          components={components}
          shop={shop ?? ""}
          pageId={pageId ?? ""}
          selectedIds={selectedIds}
          onSelectIds={onSelectIds}
        />
      )}
      {peers.length > 0 && <PeerSelectionsOverlay peers={peers} positions={positions} />}    
      <SoftLockBanner selectedIds={selectedIds} softLocksById={softLocksById} />
      {dropRect && (
        <div className="relative">
          {/* Dynamic positioning requires inline style for left/top/size */}
          {/* eslint-disable-next-line react/forbid-dom-props -- TECH-000 dynamic rect overlay positioning */}
          <div className="pointer-events-none absolute rounded border-2 border-primary/50 bg-primary/10" style={{ left: dropRect.left, top: dropRect.top, width: dropRect.width, height: dropRect.height }} />
        </div>
      )}
      <RulersOverlay
        show={showRulers}
        canvasRef={canvasRef}
        step={100}
        viewport={viewport}
        contentWidth={ruler.contentWidth}
        contentAlign={ruler.contentAlign}
        contentAlignBase={ruler.contentAlignBase}
        contentAlignSource={ruler.contentAlignSource}
      />
      {selectedIds.length > 1 && unlockedIds.length > 0 && (
        <MultiSelectOverlay
          canvasRef={canvasRef}
          ids={unlockedIds}
          viewport={viewport}
          gridEnabled={snapEnabled ?? showGrid}
          gridCols={gridCols}
          zoom={zoom}
          onApply={(patches) => onMultiSelectApply?.(patches)}
        />
      )}
      {selectedIds.length > 1 && hasLockedInSelection && (
        <div className="relative">
          <div className="pointer-events-none absolute start-2 top-2 rounded bg-muted/70 px-2 py-1 text-xs text-muted-foreground">{t("Locked items are ignored during group move/resize")}</div>
        </div>
      )}
      {showGrid && <GridOverlay gridCols={gridCols} baselineStep={showBaseline ? baselineStep : undefined} />}
      <SnapLine x={snapPosition} />
      {marquee.active && marquee.rect && (
        <div className="relative">
          {/* Dynamic positioning requires inline style for left/top/size */}
          {/* eslint-disable-next-line react/forbid-dom-props -- TECH-000 dynamic marquee overlay positioning */}
          <div className="pointer-events-none absolute rounded border-2 border-primary/40 bg-primary/10" style={{ left: marquee.rect.left, top: marquee.rect.top, width: marquee.rect.width, height: marquee.rect.height }} aria-hidden />
        </div>
      )}
    </>
  );
}
