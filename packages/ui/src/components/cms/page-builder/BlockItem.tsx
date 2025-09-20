"use client";

import type { Locale } from "@acme/i18n/locales";
import { CSS } from "@dnd-kit/utilities";
import type { PageComponent, HistoryState } from "@acme/types";
import { memo, useMemo, useState } from "react";
import type { Action } from "./state";
import Block from "./Block";
import useInlineText from "./useInlineText";
import InlineEditableButton from "./InlineEditableButton";
import useCanvasResize from "./useCanvasResize";
import useCanvasDrag from "./useCanvasDrag";
import useCanvasSpacing from "./useCanvasSpacing";
import useBlockDimensions from "./useBlockDimensions";
import useBlockDnD from "./useBlockDnD";
import BlockResizer from "./BlockResizer";
import BlockChildren from "./BlockChildren";
import ImageFocalOverlay from "./ImageFocalOverlay";
import type { DevicePreset } from "../../../utils/devicePresets";
import { LockClosedIcon } from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button as MenuButton,
  Button as UIButton,
} from "../../atoms/shadcn";
import ContextMenu from "./ContextMenu";
import { getStyleClipboard, setStyleClipboard } from "./style/styleClipboard";
import ImageAspectToolbar from "./ImageAspectToolbar";

type Props = {
  component: PageComponent;
  index: number;
  parentId: string | undefined;
  selectedIds: string[];
  onSelect: (id: string, e?: React.MouseEvent) => void;
  onRemove: () => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
  gridEnabled?: boolean;
  gridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
  device?: DevicePreset;
  editor?: HistoryState["editor"];
};

const BlockItem = memo(function BlockItemComponent({
  component,
  index,
  parentId,
  selectedIds,
  onSelect,
  onRemove,
  dispatch,
  locale,
  gridEnabled = false,
  gridCols,
  viewport,
  device,
  editor,
}: Props) {
  const selected = selectedIds.includes(component.id);
  const flags = (editor ?? {})[component.id] ?? {};
  const effLocked = (flags as any).locked ?? (component as any).locked ?? false;
  const effZIndex = (flags as any).zIndex ?? (component as any).zIndex;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
    setDropRef,
    isOver,
    containerRef,
  } = useBlockDnD(component.id, index, parentId);

  const isInlineEditableButton = component.type === "Button";
  const inline = isInlineEditableButton
    ? (useInlineText(component as any, "label") as ReturnType<
        typeof useInlineText<any, any>
      >)
    : null;

  const {
    widthKey,
    heightKey,
    widthVal,
    heightVal,
    marginKey,
    paddingKey,
    marginVal,
    paddingVal,
    leftKey,
    topKey,
    leftVal,
    topVal,
  } = useBlockDimensions({ component, viewport });

  const {
    startResize,
    guides: resizeGuides,
    distances: resizeDistances,
    snapping: resizeSnapping,
    width: resizeWidth,
    height: resizeHeight,
    left: resizeLeft,
    top: resizeTop,
    resizing,
    kbResizing,
    nudgeByKeyboard: nudgeResizeByKeyboard,
  } = useCanvasResize({
    componentId: component.id,
    widthKey,
    heightKey,
    widthVal,
    heightVal,
    dispatch,
    gridEnabled,
    gridCols,
    containerRef,
    disabled: !!effLocked || !!inline?.editing,
    leftKey,
    topKey,
    dockX: (component as any).dockX as any,
    dockY: (component as any).dockY as any,
  });

  const {
    startDrag,
    guides: dragGuides,
    distances: dragDistances,
    snapping: dragSnapping,
    width: dragWidth,
    height: dragHeight,
    left: dragLeft,
    top: dragTop,
    moving,
  } = useCanvasDrag({
    componentId: component.id,
    dispatch,
    gridEnabled,
    gridCols,
    containerRef,
    disabled: !!effLocked || !!inline?.editing,
    leftKey,
    topKey,
    dockX: (component as any).dockX as any,
    dockY: (component as any).dockY as any,
  });

  const { startSpacing, overlay: spacingOverlay, nudgeSpacingByKeyboard } = useCanvasSpacing({
    componentId: component.id,
    marginKey,
    paddingKey,
    marginVal,
    paddingVal,
    dispatch,
    containerRef,
  });

  const guides =
    resizeGuides.x !== null || resizeGuides.y !== null
      ? resizeGuides
      : dragGuides;
  const distances =
    resizeGuides.x !== null || resizeGuides.y !== null
      ? resizeDistances
      : dragDistances;
  const snapping = resizeSnapping || dragSnapping;

  const showOverlay = resizing || moving || kbResizing;
  const overlayWidth = resizing ? resizeWidth : dragWidth;
  const overlayHeight = resizing ? resizeHeight : dragHeight;
  const overlayLeft = resizing ? resizeLeft : dragLeft;
  const overlayTop = resizing ? resizeTop : dragTop;
  const childComponents = (component as { children?: PageComponent[] }).children;

  // Context menu state
  const [ctxOpen, setCtxOpen] = useState(false);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const ctxItems = useMemo(() => {
    const locked = !!effLocked;
    const z = (flags as any).zIndex as number | undefined;
    const clip = getStyleClipboard();
    const canPasteStyle = clip != null && !locked;
    const selectionSet = new Set((selectedIds || []).length > 0 ? selectedIds : [component.id]);
    if (!selectionSet.has(component.id)) selectionSet.add(component.id);
    const selection = Array.from(selectionSet);
    const isLocked = (id: string) => !!((editor as any)?.[id]?.locked);
    const unlocked = selection.filter((id) => !isLocked(id));
    const lockedSel = selection.filter((id) => isLocked(id));
    const pasteTargets = unlocked;
    const multiCount = selection.length;
    return [
      { label: "Duplicate", onClick: () => dispatch({ type: "duplicate", id: component.id }), disabled: locked },
      { label: locked ? "Unlock" : "Lock", onClick: () => dispatch({ type: "update-editor", id: component.id, patch: { locked: !locked } as any }), disabled: false },
      ...(multiCount > 1
        ? [{
            label: lockedSel.length > 0 ? `Unlock selection (${lockedSel.length})` : `Lock selection (${unlocked.length})`,
            onClick: () => {
              if (lockedSel.length > 0) {
                lockedSel.forEach((id) => dispatch({ type: "update-editor", id, patch: { locked: false } as any }));
                try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Unlocked ${lockedSel.length} blocks` })); } catch {}
              } else if (unlocked.length > 0) {
                unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { locked: true } as any }));
                try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Locked ${unlocked.length} blocks` })); } catch {}
              }
            },
            disabled: multiCount === 0,
          } as const]
        : []),
      { label: "Delete", onClick: () => onRemove(), disabled: locked },
      ...(multiCount > 1
        ? [{
            label: `Duplicate selection (${unlocked.length})`,
            onClick: () => {
              unlocked.forEach((id) => dispatch({ type: "duplicate", id }));
              try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Duplicated ${unlocked.length} blocks` })); } catch {}
            },
            disabled: unlocked.length === 0,
          } as const]
        : []),
      ...(multiCount > 1
        ? [{
            label: `Delete selection (${unlocked.length})`,
            onClick: () => {
              unlocked.forEach((id) => dispatch({ type: "remove", id }));
              try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Deleted ${unlocked.length} blocks` })); } catch {}
            },
            disabled: unlocked.length === 0,
          } as const]
        : []),
      { label: "Bring to front", onClick: () => dispatch({ type: "update-editor", id: component.id, patch: { zIndex: 999 } as any }), disabled: locked },
      { label: "Send to back", onClick: () => dispatch({ type: "update-editor", id: component.id, patch: { zIndex: 0 } as any }), disabled: locked },
      { label: "Forward", onClick: () => dispatch({ type: "update-editor", id: component.id, patch: { zIndex: ((z ?? 0) + 1) } as any }), disabled: locked },
      { label: "Backward", onClick: () => dispatch({ type: "update-editor", id: component.id, patch: { zIndex: Math.max(0, (z ?? 0) - 1) } as any }), disabled: locked },
      ...(multiCount > 1
        ? [{
            label: `Bring selection to front (${unlocked.length})`,
            onClick: () => {
              unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { zIndex: 999 } as any }));
              try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Brought ${unlocked.length} to front` })); } catch {}
            },
            disabled: unlocked.length === 0,
          },
          {
            label: `Send selection to back (${unlocked.length})`,
            onClick: () => {
              unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { zIndex: 0 } as any }));
              try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Sent ${unlocked.length} to back` })); } catch {}
            },
            disabled: unlocked.length === 0,
          }] as const
        : []),
      { label: "Copy style", onClick: () => {
          let overrides: any = {};
          try {
            overrides = component.styles ? JSON.parse(String(component.styles)) : {};
          } catch {
            overrides = {};
          }
          setStyleClipboard(overrides);
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Styles copied" })); } catch {}
        }, disabled: false },
      { label: pasteTargets.length > 1 ? `Paste style (${pasteTargets.length})` : "Paste style", onClick: () => {
          const clip2 = getStyleClipboard();
          if (!clip2) return;
          try {
            pasteTargets.forEach((id) => {
              dispatch({ type: "update", id, patch: { styles: JSON.stringify(clip2) } as any });
            });
            try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: pasteTargets.length > 1 ? `Styles pasted to ${pasteTargets.length} blocks` : "Styles pasted" })); } catch {}
          } catch {}
        }, disabled: !canPasteStyle },
    ];
  }, [effLocked, flags, component.id, component.styles, dispatch, onRemove, selectedIds, editor]);

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => onSelect(component.id, e)}
      onContextMenu={(e) => {
        e.preventDefault();
        onSelect(component.id, e);
        setCtxPos({ x: e.clientX, y: e.clientY });
        setCtxOpen(true);
      }}
      role="listitem"
      aria-grabbed={isDragging}
      aria-dropeffect="move"
      tabIndex={0}
      data-component-id={component.id}
      data-pb-contextmenu-trigger
      onKeyDown={(e) => {
        if (effLocked || inline?.editing) return;
        const key = e.key.toLowerCase();
        const isArrow = key === "arrowleft" || key === "arrowright" || key === "arrowup" || key === "arrowdown";
        if (!isArrow) return;
        // Ctrl/Cmd + Arrow: spacing (Alt => padding, otherwise margin)
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          const el = containerRef.current;
          const parent = el?.parentElement ?? null;
          const unit = gridEnabled && parent ? parent.offsetWidth / gridCols : undefined;
          const step = unit ?? (e.altKey ? 10 : 1);
          const type = e.altKey ? "padding" : "margin";
          const side = key === "arrowleft" ? "left" : key === "arrowright" ? "right" : key === "arrowup" ? "top" : "bottom";
          const delta = key === "arrowleft" || key === "arrowup" ? -step : step;
          nudgeSpacingByKeyboard(type as any, side as any, delta);
        }
        // Shift + Arrow: resize width/height
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          const el = containerRef.current;
          const parent = el?.parentElement ?? null;
          const unit = gridEnabled && parent ? parent.offsetWidth / gridCols : undefined;
          const step = unit ?? (e.altKey ? 10 : 1);
          const dir = key === "arrowleft" ? "left" : key === "arrowright" ? "right" : key === "arrowup" ? "up" : "down";
          nudgeResizeByKeyboard(dir as any, step);
        }
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        ...(effZIndex !== undefined ? { zIndex: effZIndex as number } : {}),
        ...(widthVal ? { width: widthVal } : {}),
        ...(heightVal ? { height: heightVal } : {}),
        ...(marginVal ? { margin: marginVal } : {}),
        ...(paddingVal ? { padding: paddingVal } : {}),
        ...(component.position ? { position: component.position } : {}),
        ...(() => {
          const pos: Record<string, any> = {};
          const dockX = (component as any).dockX as ("left"|"right"|"center"|undefined);
          const dockY = (component as any).dockY as ("top"|"bottom"|"center"|undefined);
          if (component.position === "absolute") {
            // Horizontal docking
            if (dockX === "right") {
              if ((component as any).right) pos.right = (component as any).right;
              else if (leftVal && (containerRef.current?.parentElement)) {
                // fallback: compute right from left/width if possible at render time
              }
            } else if (dockX === "center") {
              pos.left = 0; pos.right = 0; pos.marginLeft = "auto"; pos.marginRight = "auto";
            } else {
              if (leftVal) pos.left = leftVal;
            }
            // Vertical docking
            if (dockY === "bottom") {
              if ((component as any).bottom) pos.bottom = (component as any).bottom;
            } else if (dockY === "center") {
              pos.top = 0; pos.bottom = 0; pos.marginTop = "auto"; pos.marginBottom = "auto";
            } else {
              if (topVal) pos.top = topVal;
            }
          } else {
            if (topVal) pos.top = topVal;
            if (leftVal) pos.left = leftVal;
          }
          return pos;
        })(),
      }}
      className={
        "hover:border-primary relative rounded border hover:border-dashed" +
        (selected ? " ring-2 ring-blue-500" : "") +
        (snapping ? " border-primary" : "") +
        (isOver || isDragging ? " border-primary border-dashed" : "")
      }
    >
      <div
        className="bg-muted absolute top-0 left-0 z-10 h-3 w-3 cursor-move"
        {...attributes}
        {...(effLocked ? {} : (listeners as any))}
        role="button"
        tabIndex={0}
        aria-grabbed={isDragging}
        title="Drag or press space/enter to move"
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect(component.id, e);
          if (!effLocked && component.position === "absolute") startDrag(e);
        }}
      />
      {effLocked && (
        <div className="absolute right-1 top-1 z-30 text-xs" title="Locked" aria-hidden>
          <LockClosedIcon />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 z-20">
        <div
          className="bg-primary absolute top-0 bottom-0 w-px transition-opacity duration-150"
          style={{ left: guides.x ?? 0, opacity: guides.x !== null ? 1 : 0 }}
        />
        {distances.x !== null && (
          <div
            className="absolute -top-4 rounded bg-black/75 px-1 font-mono text-[10px] text-white shadow transition-opacity duration-150 dark:bg-white/75 dark:text-black"
            style={{
              left: (guides.x ?? 0) + 4,
              opacity: guides.x !== null ? 1 : 0,
            }}
          >
            {Math.round(distances.x)}
          </div>
        )}
        <div
          className="bg-primary absolute right-0 left-0 h-px transition-opacity duration-150"
          style={{ top: guides.y ?? 0, opacity: guides.y !== null ? 1 : 0 }}
        />
        {distances.y !== null && (
          <div
            className="absolute -left-4 rounded bg-black/75 px-1 font-mono text-[10px] text-white shadow transition-opacity duration-150 dark:bg-white/75 dark:text-black"
            style={{
              top: (guides.y ?? 0) + 4,
              opacity: guides.y !== null ? 1 : 0,
            }}
          >
            {Math.round(distances.y)}
          </div>
        )}
      </div>
      {isInlineEditableButton ? (
        <InlineEditableButton
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          component={component as any}
          locale={locale}
          inline={inline as any}
          onCommit={(patch) =>
            dispatch({ type: "update", id: component.id, patch: patch as any })
          }
        />
      ) : (
        <Block
          component={{
            ...component,
            zIndex: effZIndex,
            locked: effLocked,
            pbViewport: viewport,
          } as any}
          locale={locale}
        />
      )}
      {/* In-canvas focal point overlay for Image blocks */}
      {selected && !effLocked && component.type === "Image" && (
        <ImageFocalOverlay
          value={(component as any).focalPoint as any}
          visible={true}
          onChange={(fp) =>
            dispatch({ type: "update", id: component.id, patch: { focalPoint: fp } as any })
          }
        />
      )}
      {/* In-canvas aspect toolbar for Image blocks */}
      {selected && !effLocked && component.type === "Image" && (
        <ImageAspectToolbar
          value={(component as any).cropAspect as any}
          onChange={(next) => dispatch({ type: "update", id: component.id, patch: { cropAspect: next } as any })}
        />
      )}
      {spacingOverlay && (
        <div
          className="bg-primary/20 pointer-events-none absolute z-30"
          style={{
            top: spacingOverlay.top,
            left: spacingOverlay.left,
            width: spacingOverlay.width,
            height: spacingOverlay.height,
          }}
        />
      )}
      {showOverlay && (
        <div className="pointer-events-none absolute -top-5 left-0 z-30 rounded bg-black/75 px-1 font-mono text-[10px] text-white shadow dark:bg-white/75 dark:text-black">
          {Math.round(overlayWidth)}×{Math.round(overlayHeight)} px |{" "}
          {Math.round(overlayLeft)}, {Math.round(overlayTop)} px
        </div>
      )}
      <BlockResizer
        selected={selected}
        startResize={(e) => {
          if (!effLocked) startResize(e);
        }}
        startSpacing={(e, type, side) => {
          if (!effLocked) startSpacing(e, type, side);
        }}
      />
      <button
        type="button"
        onClick={() => { if (!effLocked) onRemove(); }}
        className="bg-danger absolute top-1 right-1 rounded px-2 text-xs disabled:opacity-50"
        data-token="--color-danger"
        disabled={!!effLocked}
        aria-disabled={!!effLocked}
        aria-label={effLocked ? "Delete disabled while locked" : "Delete"}
        title={effLocked ? "Unlock to delete" : "Delete"}
      >
        <span className="text-danger-foreground" data-token="--color-danger-fg">
          ×
        </span>
      </button>
      <div className="absolute top-1 right-10 z-30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <MenuButton type="button" variant="outline" className="h-6 px-2 py-1 text-xs">⋯</MenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); dispatch({ type: "update-editor", id: component.id, patch: { zIndex: 999 } as any }); }}>Bring to front</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); dispatch({ type: "update-editor", id: component.id, patch: { zIndex: 0 } as any }); }}>Send to back</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const z = (flags.zIndex as number | undefined) ?? 0; dispatch({ type: "update-editor", id: component.id, patch: { zIndex: z + 1 } as any }); }}>Forward</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const z = (flags.zIndex as number | undefined) ?? 0; dispatch({ type: "update-editor", id: component.id, patch: { zIndex: Math.max(0, z - 1) } as any }); }}>Backward</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <BlockChildren
        component={component}
        childComponents={childComponents}
        selectedIds={selectedIds}
        onSelect={onSelect}
        dispatch={dispatch}
        locale={locale}
        gridEnabled={gridEnabled}
        gridCols={gridCols}
        viewport={viewport}
        device={device}
        isOver={isOver}
        setDropRef={setDropRef}
      />
      <ContextMenu
        x={ctxPos.x}
        y={ctxPos.y}
        open={ctxOpen}
        onClose={() => setCtxOpen(false)}
        items={ctxItems}
      />
    </div>
  );
});

export default BlockItem;
