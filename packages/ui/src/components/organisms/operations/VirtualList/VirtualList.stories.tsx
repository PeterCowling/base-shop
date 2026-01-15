import type { Meta, StoryObj } from "@storybook/react";
import React, { useRef, useState } from "react";
import { VirtualList, VariableVirtualList, useVirtualList, type VirtualListHandle } from "./VirtualList";

const meta: Meta<typeof VirtualList> = {
  title: "Operations/VirtualList",
  component: VirtualList,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
VirtualList efficiently renders large lists by only rendering items that are visible in the viewport.
This dramatically improves performance for lists with hundreds or thousands of items.

### Features
- Fixed height virtual list
- Variable height virtual list
- Imperative scroll controls
- Infinite scroll support
- Loading states
- Keyboard navigation
- useVirtualList hook for custom implementations
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

// Generate items for demos
const generateItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
    description: `This is the description for item ${i + 1}`,
    avatar: `https://i.pravatar.cc/40?img=${(i % 70) + 1}`,
  }));

// ─────────────────────────────────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────────────────────────────────

export const Default: StoryObj<typeof VirtualList> = {
  render: () => {
    const items = generateItems(1000);

    return (
      <div className="w-[400px] rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="border-b border-slate-200 p-4">
          <h3 className="font-semibold">1,000 Items</h3>
          <p className="text-sm text-slate-500">
            Only visible items are rendered
          </p>
        </div>
        <VirtualList
          items={items}
          itemHeight={64}
          height={400}
          aria-label="Virtual list of items"
          renderItem={(item) => (
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 hover:bg-slate-50">
              <img
                src={item.avatar}
                alt=""
                className="h-10 w-10 rounded-full"
              />
              <div>
                <div className="font-medium text-slate-900">{item.title}</div>
                <div className="text-sm text-slate-500">{item.description}</div>
              </div>
            </div>
          )}
        />
      </div>
    );
  },
};

export const WithImperativeControls: StoryObj<typeof VirtualList> = {
  render: () => {
    const items = generateItems(1000);
    const listRef = useRef<VirtualListHandle>(null);
    const [targetIndex, setTargetIndex] = useState(0);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={targetIndex}
            onChange={(e) => setTargetIndex(Number(e.target.value))}
            min={0}
            max={999}
            className="w-24 rounded border border-slate-300 px-2 py-1"
            placeholder="Index"
          />
          <button
            onClick={() => listRef.current?.scrollToIndex(targetIndex, "start")}
            className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
          >
            Scroll to Start
          </button>
          <button
            onClick={() => listRef.current?.scrollToIndex(targetIndex, "center")}
            className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
          >
            Scroll to Center
          </button>
          <button
            onClick={() => listRef.current?.scrollToIndex(targetIndex, "end")}
            className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
          >
            Scroll to End
          </button>
        </div>

        <div className="w-[400px] rounded-lg border border-slate-200 bg-white shadow-lg">
          <VirtualList
            ref={listRef}
            items={items}
            itemHeight={48}
            height={400}
            renderItem={(item, index) => (
              <div
                className={`flex items-center justify-between border-b border-slate-100 px-4 py-3 ${
                  index === targetIndex ? "bg-yellow-100" : "hover:bg-slate-50"
                }`}
              >
                <span className="font-medium">{item.title}</span>
                <span className="text-sm text-slate-500">#{index}</span>
              </div>
            )}
          />
        </div>
      </div>
    );
  },
};

export const InfiniteScroll: StoryObj<typeof VirtualList> = {
  render: () => {
    const [items, setItems] = useState(() => generateItems(50));
    const [isLoading, setIsLoading] = useState(false);

    const loadMore = () => {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setItems((prev) => [
          ...prev,
          ...generateItems(50).map((item, i) => ({
            ...item,
            id: prev.length + i,
            title: `Item ${prev.length + i + 1}`,
          })),
        ]);
        setIsLoading(false);
      }, 1000);
    };

    return (
      <div className="w-[400px] rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="border-b border-slate-200 p-4">
          <h3 className="font-semibold">Infinite Scroll</h3>
          <p className="text-sm text-slate-500">
            {items.length} items loaded. Scroll to bottom to load more.
          </p>
        </div>
        <VirtualList
          items={items}
          itemHeight={64}
          height={400}
          isLoading={isLoading}
          onEndReached={loadMore}
          endReachedThreshold={100}
          renderItem={(item) => (
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 hover:bg-slate-50">
              <img
                src={item.avatar}
                alt=""
                className="h-10 w-10 rounded-full"
              />
              <div>
                <div className="font-medium text-slate-900">{item.title}</div>
                <div className="text-sm text-slate-500">{item.description}</div>
              </div>
            </div>
          )}
        />
      </div>
    );
  },
};

export const VariableHeights: StoryObj<typeof VariableVirtualList> = {
  render: () => {
    const items = generateItems(500).map((item, i) => ({
      ...item,
      expanded: i % 5 === 0,
      tags: i % 3 === 0 ? ["Featured", "New"] : [],
    }));

    return (
      <div className="w-[400px] rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="border-b border-slate-200 p-4">
          <h3 className="font-semibold">Variable Height Items</h3>
          <p className="text-sm text-slate-500">
            Items have different heights based on content
          </p>
        </div>
        <VariableVirtualList
          items={items}
          height={400}
          estimateItemHeight={(index) => (items[index].expanded ? 120 : 64)}
          renderItem={(item, _, measureRef) => (
            <div
              ref={measureRef}
              className="border-b border-slate-100 px-4 py-3 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.avatar}
                  alt=""
                  className="h-10 w-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {item.title}
                    </span>
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-slate-500">{item.description}</div>
                </div>
              </div>
              {item.expanded && (
                <div className="mt-3 rounded bg-slate-50 p-3 text-sm text-slate-600">
                  Additional content for expanded items. This demonstrates
                  variable height rendering where some items take up more space
                  than others.
                </div>
              )}
            </div>
          )}
        />
      </div>
    );
  },
};

export const WithHook: StoryObj<typeof VirtualList> = {
  render: () => {
    const items = generateItems(1000);

    function CustomVirtualList() {
      const {
        virtualItems,
        totalHeight,
        onScroll,
        containerRef,
        scrollToIndex,
        visibleRange,
      } = useVirtualList({
        items,
        itemHeight: 48,
        containerHeight: 400,
        overscan: 5,
      });

      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded bg-slate-100 px-4 py-2">
            <span className="text-sm">
              Visible: {visibleRange.startIndex} - {visibleRange.endIndex}
            </span>
            <button
              onClick={() => scrollToIndex(500)}
              className="rounded bg-slate-700 px-2 py-1 text-sm text-white"
            >
              Go to #500
            </button>
          </div>

          <div
            ref={containerRef}
            className="w-[400px] overflow-auto rounded-lg border border-slate-200 bg-white"
            style={{ height: 400 }}
            onScroll={onScroll}
          >
            <div style={{ height: totalHeight, position: "relative" }}>
              {virtualItems.map(({ item, index, style }) => (
                <div
                  key={index}
                  style={style}
                  className="flex items-center justify-between border-b border-slate-100 px-4 py-3 hover:bg-slate-50"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="text-sm text-slate-500">#{index}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return <CustomVirtualList />;
  },
};

export const VisibleRangeTracking: StoryObj<typeof VirtualList> = {
  render: () => {
    const items = generateItems(1000);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

    return (
      <div className="flex flex-col gap-4">
        <div className="rounded bg-slate-100 p-4">
          <div className="text-sm">
            <strong>Visible Range:</strong> {visibleRange.start} -{" "}
            {visibleRange.end}
          </div>
          <div className="text-sm text-slate-600">
            Rendering {visibleRange.end - visibleRange.start + 1} items out of{" "}
            {items.length}
          </div>
        </div>

        <div className="w-[400px] rounded-lg border border-slate-200 bg-white shadow-lg">
          <VirtualList
            items={items}
            itemHeight={48}
            height={400}
            onVisibleRangeChange={(start, end) => setVisibleRange({ start, end })}
            renderItem={(item, index) => (
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 hover:bg-slate-50">
                <span className="font-medium">{item.title}</span>
                <span className="text-sm text-slate-500">#{index}</span>
              </div>
            )}
          />
        </div>
      </div>
    );
  },
};

export const CustomStyling: StoryObj<typeof VirtualList> = {
  render: () => {
    const items = generateItems(100);

    return (
      <div className="w-[400px]">
        <VirtualList
          items={items}
          itemHeight={72}
          height={400}
          className="rounded-xl bg-gradient-to-b from-purple-50 to-pink-50"
          rowClassName="transition-all duration-200"
          renderItem={(item, index) => (
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                {index + 1}
              </div>
              <div>
                <div className="font-semibold text-purple-900">{item.title}</div>
                <div className="text-sm text-pink-600">{item.description}</div>
              </div>
            </div>
          )}
        />
      </div>
    );
  },
};

export const LoadingState: StoryObj<typeof VirtualList> = {
  render: () => {
    const items = generateItems(20);

    return (
      <div className="flex gap-8">
        <div className="w-[300px] rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 p-4">
            <h3 className="font-semibold">Default Loading</h3>
          </div>
          <VirtualList
            items={items}
            itemHeight={48}
            height={300}
            isLoading={true}
            renderItem={(item) => (
              <div className="border-b border-slate-100 px-4 py-3">
                {item.title}
              </div>
            )}
          />
        </div>

        <div className="w-[300px] rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 p-4">
            <h3 className="font-semibold">Custom Loading</h3>
          </div>
          <VirtualList
            items={items}
            itemHeight={48}
            height={300}
            isLoading={true}
            loadingIndicator={
              <div className="flex items-center gap-2 text-purple-600">
                <span className="animate-bounce">🚀</span>
                Fetching more items...
              </div>
            }
            renderItem={(item) => (
              <div className="border-b border-slate-100 px-4 py-3">
                {item.title}
              </div>
            )}
          />
        </div>
      </div>
    );
  },
};
