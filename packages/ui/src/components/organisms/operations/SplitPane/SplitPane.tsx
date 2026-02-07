"use client";

import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "../../../../utils/style/cn";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SplitPaneProps {
  /** First (left/top) pane content */
  children: [ReactNode, ReactNode];
  /** Direction of the split */
  direction?: "horizontal" | "vertical";
  /** Default size of the first pane (pixels or percentage string like "50%") */
  defaultSize?: number | string;
  /** Minimum size of the first pane in pixels */
  minSize?: number;
  /** Maximum size of the first pane in pixels */
  maxSize?: number;
  /** Minimum size of the second pane in pixels */
  minSecondarySize?: number;
  /** Custom className for the container */
  className?: string;
  /** Custom className for the first pane */
  primaryPaneClassName?: string;
  /** Custom className for the second pane */
  secondaryPaneClassName?: string;
  /** Custom className for the resize handle */
  handleClassName?: string;
  /** Called when the pane is being resized */
  onResize?: (size: number) => void;
  /** Called when resizing starts */
  onResizeStart?: () => void;
  /** Called when resizing ends */
  onResizeEnd?: (size: number) => void;
  /** Whether resizing is disabled */
  disabled?: boolean;
  /** Size of the resize handle in pixels */
  handleSize?: number;
  /** Whether to collapse the primary pane when dragged to minimum */
  collapsible?: boolean;
  /** Whether the primary pane is currently collapsed */
  collapsed?: boolean;
  /** Called when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** ARIA label for the resize handle */
  "aria-label"?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function SplitPane({
  children,
  direction = "horizontal",
  defaultSize = "50%",
  minSize = 100,
  maxSize,
  minSecondarySize = 100,
  className,
  primaryPaneClassName,
  secondaryPaneClassName,
  handleClassName,
  onResize,
  onResizeStart,
  onResizeEnd,
  disabled = false,
  handleSize = 4,
  collapsible = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  "aria-label": ariaLabel = "Resize",
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const collapsed = controlledCollapsed ?? internalCollapsed;
  const isHorizontal = direction === "horizontal";

  // Parse default size
  const parseSize = useCallback((value: number | string, containerSize: number): number => {
    if (typeof value === "number") {
      return value;
    }
    if (value.endsWith("%")) {
      const percent = parseFloat(value) / 100;
      return containerSize * percent;
    }
    return parseFloat(value);
  }, []);

  // Initialize size on mount
  useEffect(() => {
    if (size === null && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerSize = isHorizontal ? containerRect.width : containerRect.height;
      const initialSize = parseSize(defaultSize, containerSize);
      setSize(Math.max(minSize, Math.min(maxSize ?? containerSize, initialSize)));
    }
  }, [size, defaultSize, isHorizontal, minSize, maxSize, parseSize]);

  // Handle resize
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      e.preventDefault();
      setIsResizing(true);
      onResizeStart?.();

      const startPos = isHorizontal ? e.clientX : e.clientY;
      const startSize = size ?? 0;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const containerSize = isHorizontal ? containerRect.width : containerRect.height;
        const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPos - startPos;

        let newSize = startSize + delta;

        // Apply constraints
        newSize = Math.max(minSize, newSize);
        if (maxSize) {
          newSize = Math.min(maxSize, newSize);
        }
        newSize = Math.min(newSize, containerSize - minSecondarySize - handleSize);

        // Handle collapse
        if (collapsible && newSize < minSize * 0.5) {
          if (!collapsed) {
            setInternalCollapsed(true);
            onCollapsedChange?.(true);
          }
          return;
        } else if (collapsible && collapsed && newSize >= minSize) {
          setInternalCollapsed(false);
          onCollapsedChange?.(false);
        }

        setSize(newSize);
        onResize?.(newSize);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        onResizeEnd?.(size ?? 0);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [
      disabled,
      isHorizontal,
      size,
      minSize,
      maxSize,
      minSecondarySize,
      handleSize,
      collapsible,
      collapsed,
      onResize,
      onResizeStart,
      onResizeEnd,
      onCollapsedChange,
    ]
  );

  // Handle touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      const touch = e.touches[0];
      setIsResizing(true);
      onResizeStart?.();

      const startPos = isHorizontal ? touch.clientX : touch.clientY;
      const startSize = size ?? 0;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        if (!containerRef.current) return;
        moveEvent.preventDefault();

        const currentTouch = moveEvent.touches[0];
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerSize = isHorizontal ? containerRect.width : containerRect.height;
        const currentPos = isHorizontal ? currentTouch.clientX : currentTouch.clientY;
        const delta = currentPos - startPos;

        let newSize = startSize + delta;
        newSize = Math.max(minSize, newSize);
        if (maxSize) {
          newSize = Math.min(maxSize, newSize);
        }
        newSize = Math.min(newSize, containerSize - minSecondarySize - handleSize);

        setSize(newSize);
        onResize?.(newSize);
      };

      const handleTouchEnd = () => {
        setIsResizing(false);
        onResizeEnd?.(size ?? 0);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };

      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    },
    [
      disabled,
      isHorizontal,
      size,
      minSize,
      maxSize,
      minSecondarySize,
      handleSize,
      onResize,
      onResizeStart,
      onResizeEnd,
    ]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      const step = e.shiftKey ? 50 : 10;
      let newSize = size ?? 0;

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          newSize = Math.max(minSize, newSize - step);
          break;
        case "ArrowRight":
        case "ArrowDown":
          newSize = newSize + step;
          if (maxSize) {
            newSize = Math.min(maxSize, newSize);
          }
          break;
        case "Home":
          newSize = minSize;
          break;
        case "End":
          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const containerSize = isHorizontal ? containerRect.width : containerRect.height;
            newSize = maxSize ?? (containerSize - minSecondarySize - handleSize);
          }
          break;
        default:
          return;
      }

      e.preventDefault();
      setSize(newSize);
      onResize?.(newSize);
    },
    [disabled, size, minSize, maxSize, minSecondarySize, handleSize, isHorizontal, onResize]
  );

  // Double-click to reset to default
  const handleDoubleClick = useCallback(() => {
    if (disabled) return;

    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerSize = isHorizontal ? containerRect.width : containerRect.height;
      const newSize = parseSize(defaultSize, containerSize);
      setSize(Math.max(minSize, Math.min(maxSize ?? containerSize, newSize)));
      onResize?.(newSize);
    }
  }, [disabled, defaultSize, isHorizontal, minSize, maxSize, parseSize, onResize]);

  // Compute pane sizes
  const paneStyles = useMemo(() => {
    const currentSize = collapsed ? 0 : (size ?? 0);

    if (isHorizontal) {
      return {
        primary: { width: currentSize, minWidth: collapsed ? 0 : minSize },
        secondary: { flex: 1, minWidth: minSecondarySize },
      };
    }
    return {
      primary: { height: currentSize, minHeight: collapsed ? 0 : minSize },
      secondary: { flex: 1, minHeight: minSecondarySize },
    };
  }, [size, collapsed, isHorizontal, minSize, minSecondarySize]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "split-pane flex h-full w-full",
        isHorizontal ? "flex-row" : "flex-col",
        isResizing && "select-none",
        className
      )}
    >
      {/* Primary Pane */}
      <div
        className={cn(
          "split-pane-primary overflow-hidden",
          collapsed && "hidden",
          primaryPaneClassName
        )}
        style={paneStyles.primary}
      >
        {children[0]}
      </div>

      {/* Resize Handle */}
      <div
        role="separator"
        aria-label={ariaLabel}
        aria-orientation={isHorizontal ? "vertical" : "horizontal"}
        aria-valuenow={size ?? 0}
        aria-valuemin={minSize}
        aria-valuemax={maxSize}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "split-pane-handle flex-shrink-0",
          "group relative",
          isHorizontal
            ? "h-full cursor-col-resize"
            : "w-full cursor-row-resize",
          disabled && "pointer-events-none opacity-50",
          isResizing && "bg-primary",
          handleClassName
        )}
        style={{
          [isHorizontal ? "width" : "height"]: handleSize,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Visual indicator */}
        <div
          className={cn(
            "absolute inset-0 transition-colors",
            isHorizontal
              ? "w-full bg-slate-200 group-hover:bg-slate-300"
              : "h-full bg-slate-200 group-hover:bg-slate-300",
            isResizing && "bg-primary"
          )}
        />
        {/* Larger hit area */}
        <div
          className={cn(
            "absolute",
            isHorizontal
              ? "-left-1 -right-1 top-0 bottom-0"
              : "-top-1 -bottom-1 left-0 right-0"
          )}
        />
      </div>

      {/* Secondary Pane */}
      <div
        className={cn(
          "split-pane-secondary overflow-hidden",
          secondaryPaneClassName
        )}
        style={paneStyles.secondary}
      >
        {children[1]}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// useSplitPane Hook
// ─────────────────────────────────────────────────────────────────────────────

export interface UseSplitPaneOptions {
  /** Direction of the split */
  direction?: "horizontal" | "vertical";
  /** Default size of the first pane */
  defaultSize?: number;
  /** Minimum size of the first pane */
  minSize?: number;
  /** Maximum size of the first pane */
  maxSize?: number;
}

export interface UseSplitPaneResult {
  /** Current size of the first pane */
  size: number;
  /** Set the size of the first pane */
  setSize: (size: number) => void;
  /** Whether currently resizing */
  isResizing: boolean;
  /** Props to spread on the resize handle */
  handleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    style: React.CSSProperties;
    role: "separator";
    tabIndex: number;
  };
  /** Ref to attach to the container */
  containerRef: React.RefObject<HTMLDivElement>;
}

export function useSplitPane({
  direction = "horizontal",
  defaultSize = 300,
  minSize = 100,
  maxSize,
}: UseSplitPaneOptions = {}): UseSplitPaneResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const isHorizontal = direction === "horizontal";

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startPos = isHorizontal ? e.clientX : e.clientY;
      const startSize = size;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const containerSize = isHorizontal ? containerRect.width : containerRect.height;
        const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPos - startPos;

        let newSize = startSize + delta;
        newSize = Math.max(minSize, newSize);
        if (maxSize) {
          newSize = Math.min(maxSize, newSize);
        }
        newSize = Math.min(newSize, containerSize - minSize);

        setSize(newSize);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isHorizontal, size, minSize, maxSize]
  );

  const handleProps = useMemo(
    () => ({
      onMouseDown: handleMouseDown,
      style: {
        cursor: isHorizontal ? "col-resize" : "row-resize",
      } as React.CSSProperties,
      role: "separator" as const,
      tabIndex: 0,
    }),
    [handleMouseDown, isHorizontal]
  );

  return {
    size,
    setSize,
    isResizing,
    handleProps,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
  };
}

export default SplitPane;
