/* eslint-disable ds/no-hardcoded-copy -- UI-3000 [ttl=2026-12-31] svg attrs + default loading labels */
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { cn } from "../../../../utils/style/cn";
import { Inline } from "../../../atoms/primitives/Inline";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels (fixed height mode) */
  itemHeight: number;
  /** Height of the container in pixels */
  height: number;
  /** Width of the container */
  width?: number | string;
  /** Number of items to render above/below the visible area */
  overscan?: number;
  /** Custom className for the container */
  className?: string;
  /** Custom className for each row */
  rowClassName?: string;
  /** Render function for each item */
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  /** Called when scroll position changes */
  onScroll?: (scrollTop: number) => void;
  /** Called when visible range changes */
  onVisibleRangeChange?: (startIndex: number, endIndex: number) => void;
  /** Loading state - shows loading indicator at bottom */
  isLoading?: boolean;
  /** Custom loading indicator */
  loadingIndicator?: ReactNode;
  /** Called when scrolled to bottom (for infinite scroll) */
  onEndReached?: () => void;
  /** Threshold in pixels from bottom to trigger onEndReached */
  endReachedThreshold?: number;
  /** Initial scroll offset */
  initialScrollOffset?: number;
  /** Accessibility label for the list */
  "aria-label"?: string;
  /** Role for the list container */
  role?: string;
}

export interface VirtualListHandle {
  /** Scroll to a specific item index */
  scrollToIndex: (index: number, align?: "start" | "center" | "end") => void;
  /** Scroll to a specific offset */
  scrollToOffset: (offset: number) => void;
  /** Get current scroll offset */
  getScrollOffset: () => number;
  /** Get visible range */
  getVisibleRange: () => { startIndex: number; endIndex: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

// Wrap DOM nodes to satisfy react/forbid-dom-props for "style"
const StyledDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} {...props} />
);
StyledDiv.displayName = "StyledDiv";

function VirtualListInner<T>(
  {
    items,
    itemHeight,
    height,
    width = "100%",
    overscan = 3,
    className,
    rowClassName,
    renderItem,
    onScroll,
    onVisibleRangeChange,
    isLoading = false,
    loadingIndicator,
    onEndReached,
    endReachedThreshold = 100,
    initialScrollOffset = 0,
    "aria-label": ariaLabel,
    role = "list",
  }: VirtualListProps<T>,
  ref: React.ForwardedRef<VirtualListHandle>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(initialScrollOffset);
  const endReachedRef = useRef(false);

  // Calculate total height and visible range
  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex } = useMemo(() => {
    const visibleCount = Math.ceil(height / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor(scrollTop / itemHeight) + visibleCount + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, height, itemHeight, items.length, overscan]);

  // Notify parent of visible range changes
  useEffect(() => {
    onVisibleRangeChange?.(startIndex, endIndex);
  }, [startIndex, endIndex, onVisibleRangeChange]);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);

      // Check if we've reached the end
      const scrollHeight = e.currentTarget.scrollHeight;
      const clientHeight = e.currentTarget.clientHeight;
      const isNearEnd = scrollHeight - newScrollTop - clientHeight < endReachedThreshold;

      if (isNearEnd && !endReachedRef.current && onEndReached && !isLoading) {
        endReachedRef.current = true;
        onEndReached();
      } else if (!isNearEnd) {
        endReachedRef.current = false;
      }
    },
    [onScroll, onEndReached, endReachedThreshold, isLoading]
  );

  // Set initial scroll position
  useEffect(() => {
    if (containerRef.current && initialScrollOffset > 0) {
      containerRef.current.scrollTop = initialScrollOffset;
    }
  }, [initialScrollOffset]);

  // Expose imperative handle
  React.useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, align: "start" | "center" | "end" = "start") => {
      if (!containerRef.current) return;

      let offset: number;
      switch (align) {
        case "center":
          offset = index * itemHeight - height / 2 + itemHeight / 2;
          break;
        case "end":
          offset = (index + 1) * itemHeight - height;
          break;
        default:
          offset = index * itemHeight;
      }

      containerRef.current.scrollTop = Math.max(0, Math.min(offset, totalHeight - height));
    },
    scrollToOffset: (offset: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = offset;
      }
    },
    getScrollOffset: () => scrollTop,
    getVisibleRange: () => ({ startIndex, endIndex }),
  }), [scrollTop, startIndex, endIndex, itemHeight, height, totalHeight]);

  // Generate visible items
  const visibleItems = useMemo(() => {
    const result: ReactNode[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      if (i < items.length) {
        const style: CSSProperties = {
          position: "absolute",
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        };
        result.push(
          <StyledDiv
            key={i}
            className={cn("virtual-list-row", rowClassName)}
            style={style}
            role="listitem"
          >
            {renderItem(items[i], i, style)}
          </StyledDiv>
        );
      }
    }

    return result;
  }, [startIndex, endIndex, items, itemHeight, renderItem, rowClassName]);

  const loadingAriaLabel =
    "Loading more items"; // i18n-exempt -- UI-3000 [ttl=2026-12-31] loading status label
  const loadingLabel = "Loading..."; // i18n-exempt -- UI-3000 [ttl=2026-12-31] loading status label

  return (
    <StyledDiv
      ref={containerRef}
      className={cn(
        "virtual-list-container relative overflow-auto",
        className
      )}
      style={{
        height,
        width,
      }}
      onScroll={handleScroll}
      aria-label={ariaLabel}
      role={role}
      tabIndex={0}
    >
      <StyledDiv
        className="virtual-list-inner relative"
        style={{
          height: totalHeight,
          width: "100%",
        }}
      >
        {visibleItems}
      </StyledDiv>
      {isLoading && (
        <div
          className="virtual-list-loading sticky bottom-0 inset-x-0 py-4"
          role="progressbar"
          aria-label={loadingAriaLabel}
        >
          {loadingIndicator || (
            <Inline gap={2} className="text-sm text-foreground/60 justify-center">
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {loadingLabel}
            </Inline>
          )}
        </div>
      )}
    </StyledDiv>
  );
}

export const VirtualList = React.forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<VirtualListHandle> }
) => ReturnType<typeof VirtualListInner>;

// ─────────────────────────────────────────────────────────────────────────────
// Variable Height Virtual List
// ─────────────────────────────────────────────────────────────────────────────

export interface VariableVirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Function to estimate item height before measurement */
  estimateItemHeight: (index: number, item: T) => number;
  /** Height of the container in pixels */
  height: number;
  /** Width of the container */
  width?: number | string;
  /** Number of items to render above/below the visible area */
  overscan?: number;
  /** Custom className for the container */
  className?: string;
  /** Render function for each item */
  renderItem: (item: T, index: number, measureRef: (el: HTMLElement | null) => void) => ReactNode;
  /** Called when scroll position changes */
  onScroll?: (scrollTop: number) => void;
}

interface MeasuredItem {
  offset: number;
  height: number;
}

export function VariableVirtualList<T>({
  items,
  estimateItemHeight,
  height,
  width = "100%",
  overscan = 3,
  className,
  renderItem,
  onScroll,
}: VariableVirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredItems, setMeasuredItems] = useState<Map<number, MeasuredItem>>(new Map());

  // Calculate positions for all items
  const { totalHeight, itemPositions } = useMemo(() => {
    const positions: MeasuredItem[] = [];
    let offset = 0;

    for (let i = 0; i < items.length; i++) {
      const measured = measuredItems.get(i);
      const itemHeight = measured?.height ?? estimateItemHeight(i, items[i]);
      positions.push({ offset, height: itemHeight });
      offset += itemHeight;
    }

    return { totalHeight: offset, itemPositions: positions };
  }, [items, measuredItems, estimateItemHeight]);

  // Find visible range using binary search
  const { startIndex, endIndex } = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: -1 };
    }

    // Binary search for start index
    let low = 0;
    let high = items.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const pos = itemPositions[mid];
      if (pos.offset + pos.height <= scrollTop) {
        low = mid + 1;
      } else if (pos.offset > scrollTop) {
        high = mid - 1;
      } else {
        low = mid;
        break;
      }
    }
    const startIndex = Math.max(0, low - overscan);

    // Find end index
    let endIndex = startIndex;
    const viewportEnd = scrollTop + height;
    while (endIndex < items.length && itemPositions[endIndex].offset < viewportEnd) {
      endIndex++;
    }
    endIndex = Math.min(items.length - 1, endIndex + overscan);

    return { startIndex, endIndex };
  }, [scrollTop, height, items.length, itemPositions, overscan]);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  // Create measure ref factory
  const createMeasureRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        const measuredHeight = rect.height;
        const currentMeasured = measuredItems.get(index);

        if (!currentMeasured || currentMeasured.height !== measuredHeight) {
          setMeasuredItems((prev) => {
            const next = new Map(prev);
            const currentOffset = itemPositions[index]?.offset ?? 0;
            next.set(index, { offset: currentOffset, height: measuredHeight });
            return next;
          });
        }
      }
    },
    [measuredItems, itemPositions]
  );

  // Generate visible items
  const visibleItems = useMemo(() => {
    const result: ReactNode[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      if (i < items.length) {
        const pos = itemPositions[i];
        result.push(
          <StyledDiv
            key={i}
            style={{
              position: "absolute",
              top: pos.offset,
              left: 0,
              right: 0,
              minHeight: pos.height,
            }}
            role="listitem"
          >
            {renderItem(items[i], i, createMeasureRef(i))}
          </StyledDiv>
        );
      }
    }

    return result;
  }, [startIndex, endIndex, items, itemPositions, renderItem, createMeasureRef]);

  return (
    <StyledDiv
      ref={containerRef}
      className={cn("virtual-list-container relative overflow-auto", className)}
      style={{
        height,
        width,
        position: "relative",
      }}
      onScroll={handleScroll}
      role="list"
      tabIndex={0}
    >
      <StyledDiv
        className="virtual-list-inner"
        style={{
          height: totalHeight,
          position: "relative",
          width: "100%",
        }}
      >
        {visibleItems}
      </StyledDiv>
    </StyledDiv>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// useVirtualList Hook
// ─────────────────────────────────────────────────────────────────────────────

export interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface UseVirtualListResult<T> {
  /** Items currently visible in the viewport */
  virtualItems: Array<{ item: T; index: number; style: CSSProperties }>;
  /** Total height of all items */
  totalHeight: number;
  /** Scroll handler to attach to container */
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  /** Container ref to attach */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Scroll to specific index */
  scrollToIndex: (index: number) => void;
  /** Current visible range */
  visibleRange: { startIndex: number; endIndex: number };
}

export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
}: UseVirtualListOptions<T>): UseVirtualListResult<T> {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex } = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor(scrollTop / itemHeight) + visibleCount + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan]);

  const virtualItems = useMemo(() => {
    const result: Array<{ item: T; index: number; style: CSSProperties }> = [];

    for (let i = startIndex; i <= endIndex; i++) {
      if (i < items.length) {
        result.push({
          item: items[i],
          index: i,
          style: {
            position: "absolute" as const,
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          },
        });
      }
    }

    return result;
  }, [startIndex, endIndex, items, itemHeight]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    },
    [itemHeight]
  );

  return {
    virtualItems,
    totalHeight,
    onScroll,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    scrollToIndex,
    visibleRange: { startIndex, endIndex },
  };
}

export default VirtualList;
