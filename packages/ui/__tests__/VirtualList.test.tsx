import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  VirtualList,
  VariableVirtualList,
  useVirtualList,
  type VirtualListHandle,
} from "../src/components/organisms/operations/VirtualList/VirtualList";

// Generate test items
const generateItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    text: `Item ${i}`,
  }));

describe("VirtualList", () => {
  describe("rendering", () => {
    it("renders visible items only", () => {
      const items = generateItems(100);

      render(
        <VirtualList
          items={items}
          itemHeight={50}
          height={200}
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      // With height=200 and itemHeight=50, we should see ~4 items visible
      // Plus overscan (default 3) above and below
      expect(screen.getByText("Item 0")).toBeInTheDocument();
      expect(screen.getByText("Item 5")).toBeInTheDocument();

      // Items far down the list should not be rendered
      expect(screen.queryByText("Item 50")).not.toBeInTheDocument();
      expect(screen.queryByText("Item 99")).not.toBeInTheDocument();
    });

    it("respects custom overscan", () => {
      const items = generateItems(100);

      render(
        <VirtualList
          items={items}
          itemHeight={50}
          height={200}
          overscan={1}
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      // With overscan=1, fewer items should be rendered
      expect(screen.getByText("Item 0")).toBeInTheDocument();
      expect(screen.getByText("Item 4")).toBeInTheDocument();

      // With smaller overscan, item 6 should not be rendered
      expect(screen.queryByText("Item 8")).not.toBeInTheDocument();
    });

    it("applies custom className", () => {
      const items = generateItems(10);

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={50}
          height={200}
          className="custom-list"
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      expect(container.querySelector(".custom-list")).toBeInTheDocument();
    });

    it("applies aria-label", () => {
      const items = generateItems(10);

      render(
        <VirtualList
          items={items}
          itemHeight={50}
          height={200}
          aria-label="Test list"
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      expect(screen.getByLabelText("Test list")).toBeInTheDocument();
    });
  });

  describe("scrolling", () => {
    it("renders different items when scrolled", () => {
      const items = generateItems(100);

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={50}
          height={200}
          overscan={1}
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      const listContainer = container.querySelector(".virtual-list-container");
      expect(listContainer).toBeInTheDocument();

      // Initially item 0 should be visible
      expect(screen.getByText("Item 0")).toBeInTheDocument();

      // Scroll down
      act(() => {
        Object.defineProperty(listContainer, "scrollTop", {
          writable: true,
          value: 500,
        });
        fireEvent.scroll(listContainer!);
      });

      // After scrolling 500px (10 items), item 10 should now be visible
      expect(screen.getByText("Item 10")).toBeInTheDocument();
      // Item 0 should no longer be visible
      expect(screen.queryByText("Item 0")).not.toBeInTheDocument();
    });

    it("calls onScroll callback", () => {
      const items = generateItems(100);
      const onScroll = jest.fn();

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={50}
          height={200}
          onScroll={onScroll}
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      const listContainer = container.querySelector(".virtual-list-container");

      act(() => {
        Object.defineProperty(listContainer, "scrollTop", {
          writable: true,
          value: 100,
        });
        fireEvent.scroll(listContainer!);
      });

      expect(onScroll).toHaveBeenCalledWith(100);
    });

    it("calls onVisibleRangeChange callback", () => {
      const items = generateItems(100);
      const onVisibleRangeChange = jest.fn();

      render(
        <VirtualList
          items={items}
          itemHeight={50}
          height={200}
          onVisibleRangeChange={onVisibleRangeChange}
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      // Should be called on initial render
      expect(onVisibleRangeChange).toHaveBeenCalled();
    });
  });

  describe("imperative handle", () => {
    it("provides scrollToIndex method", () => {
      const items = generateItems(100);
      const ref = React.createRef<VirtualListHandle>();

      const { container } = render(
        <VirtualList
          ref={ref}
          items={items}
          itemHeight={50}
          height={200}
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      const listContainer = container.querySelector(".virtual-list-container") as HTMLDivElement;

      act(() => {
        ref.current?.scrollToIndex(20);
      });

      // Container should have scrolled
      expect(listContainer.scrollTop).toBe(1000); // 20 * 50
    });

    it("provides scrollToIndex with align center", () => {
      const items = generateItems(100);
      const ref = React.createRef<VirtualListHandle>();

      const { container } = render(
        <VirtualList
          ref={ref}
          items={items}
          itemHeight={50}
          height={200}
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      const listContainer = container.querySelector(".virtual-list-container") as HTMLDivElement;

      act(() => {
        ref.current?.scrollToIndex(20, "center");
      });

      // Should center item 20 in viewport
      // offset = 20 * 50 - 200/2 + 50/2 = 1000 - 100 + 25 = 925
      expect(listContainer.scrollTop).toBe(925);
    });

    it("provides getVisibleRange method", () => {
      const items = generateItems(100);
      const ref = React.createRef<VirtualListHandle>();

      render(
        <VirtualList
          ref={ref}
          items={items}
          itemHeight={50}
          height={200}
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      const range = ref.current?.getVisibleRange();
      expect(range).toBeDefined();
      expect(range?.startIndex).toBe(0);
      expect(range?.endIndex).toBeGreaterThan(0);
    });
  });

  describe("loading state", () => {
    it("shows loading indicator when isLoading is true", () => {
      const items = generateItems(10);

      render(
        <VirtualList
          items={items}
          itemHeight={50}
          height={200}
          isLoading={true}
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("uses custom loading indicator", () => {
      const items = generateItems(10);

      render(
        <VirtualList
          items={items}
          itemHeight={50}
          height={200}
          isLoading={true}
          loadingIndicator={<div>Custom Loading</div>}
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      expect(screen.getByText("Custom Loading")).toBeInTheDocument();
    });
  });

  describe("infinite scroll", () => {
    it("calls onEndReached when scrolled to bottom", () => {
      const items = generateItems(10);
      const onEndReached = jest.fn();

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={50}
          height={200}
          onEndReached={onEndReached}
          endReachedThreshold={50}
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      const listContainer = container.querySelector(".virtual-list-container");

      // Simulate scrolling near the end
      act(() => {
        Object.defineProperty(listContainer, "scrollTop", {
          writable: true,
          value: 250, // Near the bottom of 500px total height
        });
        Object.defineProperty(listContainer, "scrollHeight", {
          writable: true,
          value: 500,
        });
        Object.defineProperty(listContainer, "clientHeight", {
          writable: true,
          value: 200,
        });
        fireEvent.scroll(listContainer!);
      });

      expect(onEndReached).toHaveBeenCalled();
    });

    it("does not call onEndReached while loading", () => {
      const items = generateItems(10);
      const onEndReached = jest.fn();

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={50}
          height={200}
          isLoading={true}
          onEndReached={onEndReached}
          endReachedThreshold={50}
          renderItem={(item) => <div>{item.text}</div>}
        />
      );

      const listContainer = container.querySelector(".virtual-list-container");

      act(() => {
        Object.defineProperty(listContainer, "scrollTop", {
          writable: true,
          value: 250,
        });
        Object.defineProperty(listContainer, "scrollHeight", {
          writable: true,
          value: 500,
        });
        Object.defineProperty(listContainer, "clientHeight", {
          writable: true,
          value: 200,
        });
        fireEvent.scroll(listContainer!);
      });

      expect(onEndReached).not.toHaveBeenCalled();
    });
  });

  describe("empty state", () => {
    it("renders empty list without errors", () => {
      const { container } = render(
        <VirtualList
          items={[]}
          itemHeight={50}
          height={200}
          renderItem={(item: unknown) => <div>{String(item)}</div>}
        />
      );

      expect(container.querySelector(".virtual-list-container")).toBeInTheDocument();
      expect(container.querySelectorAll("[role='listitem']")).toHaveLength(0);
    });
  });
});

describe("VariableVirtualList", () => {
  it("renders items with variable heights", () => {
    const items = generateItems(100);

    render(
      <VariableVirtualList
        items={items}
        estimateItemHeight={(index) => (index % 2 === 0 ? 50 : 100)}
        height={300}
        renderItem={(item, _, measureRef) => (
          <div ref={measureRef}>{item.text}</div>
        )}
      />
    );

    // Should render initial visible items
    expect(screen.getByText("Item 0")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  it("handles scroll with variable heights", () => {
    const items = generateItems(100);

    const { container } = render(
      <VariableVirtualList
        items={items}
        estimateItemHeight={() => 50}
        height={200}
        renderItem={(item, _, measureRef) => (
          <div ref={measureRef}>{item.text}</div>
        )}
      />
    );

    const listContainer = container.querySelector(".virtual-list-container");

    act(() => {
      Object.defineProperty(listContainer, "scrollTop", {
        writable: true,
        value: 500,
      });
      fireEvent.scroll(listContainer!);
    });

    // Should show different items after scroll
    expect(screen.getByText("Item 10")).toBeInTheDocument();
  });
});

describe("useVirtualList hook", () => {
  function TestComponent({ items }: { items: Array<{ id: number; text: string }> }) {
    const {
      virtualItems,
      totalHeight,
      onScroll,
      containerRef,
      visibleRange,
    } = useVirtualList({
      items,
      itemHeight: 50,
      containerHeight: 200,
      overscan: 2,
    });

    return (
      <div>
        <div data-cy="total-height">{totalHeight}</div>
        <div data-cy="start-index">{visibleRange.startIndex}</div>
        <div data-cy="end-index">{visibleRange.endIndex}</div>
        <div
          ref={containerRef}
          className="test-container"
          style={{ height: 200, overflow: "auto", position: "relative" }}
          onScroll={onScroll}
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            {virtualItems.map(({ item, index, style }) => (
              <div key={index} style={style}>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  it("provides correct totalHeight", () => {
    const items = generateItems(100);

    render(<TestComponent items={items} />);

    expect(screen.getByTestId("total-height")).toHaveTextContent("5000"); // 100 * 50
  });

  it("provides correct visible range", () => {
    const items = generateItems(100);

    render(<TestComponent items={items} />);

    expect(screen.getByTestId("start-index")).toHaveTextContent("0");
    // End index should be visible count + overscan
    const endIndex = parseInt(screen.getByTestId("end-index").textContent || "0");
    expect(endIndex).toBeGreaterThan(3);
    expect(endIndex).toBeLessThan(10);
  });

  it("renders virtual items", () => {
    const items = generateItems(100);

    render(<TestComponent items={items} />);

    expect(screen.getByText("Item 0")).toBeInTheDocument();
    expect(screen.getByText("Item 5")).toBeInTheDocument();
    expect(screen.queryByText("Item 50")).not.toBeInTheDocument();
  });
});
