import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  SplitPane,
  useSplitPane,
} from "../src/components/organisms/operations/SplitPane/SplitPane";

describe("SplitPane", () => {
  describe("rendering", () => {
    it("renders both panes", () => {
      render(
        <SplitPane>
          <div>Left Pane</div>
          <div>Right Pane</div>
        </SplitPane>
      );

      expect(screen.getByText("Left Pane")).toBeInTheDocument();
      expect(screen.getByText("Right Pane")).toBeInTheDocument();
    });

    it("renders resize handle", () => {
      render(
        <SplitPane>
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      expect(screen.getByRole("separator")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <SplitPane className="custom-split">
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      expect(container.querySelector(".custom-split")).toBeInTheDocument();
    });

    it("applies aria-label to handle", () => {
      render(
        <SplitPane aria-label="Resize panels">
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      expect(screen.getByLabelText("Resize panels")).toBeInTheDocument();
    });

    it("renders horizontally by default", () => {
      const { container } = render(
        <SplitPane>
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      expect(container.querySelector(".split-pane")).toHaveClass("flex-row");
    });

    it("renders vertically when specified", () => {
      const { container } = render(
        <SplitPane direction="vertical">
          <div>Top</div>
          <div>Bottom</div>
        </SplitPane>
      );

      expect(container.querySelector(".split-pane")).toHaveClass("flex-col");
    });
  });

  describe("pane structure", () => {
    it("has primary pane", () => {
      const { container } = render(
        <SplitPane>
          <div>Primary</div>
          <div>Secondary</div>
        </SplitPane>
      );

      expect(container.querySelector(".split-pane-primary")).toBeInTheDocument();
    });

    it("has secondary pane", () => {
      const { container } = render(
        <SplitPane>
          <div>Primary</div>
          <div>Secondary</div>
        </SplitPane>
      );

      expect(container.querySelector(".split-pane-secondary")).toBeInTheDocument();
    });

    it("applies primaryPaneClassName", () => {
      const { container } = render(
        <SplitPane primaryPaneClassName="custom-primary">
          <div>Primary</div>
          <div>Secondary</div>
        </SplitPane>
      );

      expect(container.querySelector(".custom-primary")).toBeInTheDocument();
    });

    it("applies secondaryPaneClassName", () => {
      const { container } = render(
        <SplitPane secondaryPaneClassName="custom-secondary">
          <div>Primary</div>
          <div>Secondary</div>
        </SplitPane>
      );

      expect(container.querySelector(".custom-secondary")).toBeInTheDocument();
    });
  });

  describe("resize handle", () => {
    it("has correct orientation for horizontal split", () => {
      render(
        <SplitPane direction="horizontal">
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      expect(screen.getByRole("separator")).toHaveAttribute(
        "aria-orientation",
        "vertical"
      );
    });

    it("has correct orientation for vertical split", () => {
      render(
        <SplitPane direction="vertical">
          <div>Top</div>
          <div>Bottom</div>
        </SplitPane>
      );

      expect(screen.getByRole("separator")).toHaveAttribute(
        "aria-orientation",
        "horizontal"
      );
    });

    it("has correct cursor for horizontal split", () => {
      const { container } = render(
        <SplitPane direction="horizontal">
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      expect(container.querySelector(".split-pane-handle")).toHaveClass(
        "cursor-col-resize"
      );
    });

    it("has correct cursor for vertical split", () => {
      const { container } = render(
        <SplitPane direction="vertical">
          <div>Top</div>
          <div>Bottom</div>
        </SplitPane>
      );

      expect(container.querySelector(".split-pane-handle")).toHaveClass(
        "cursor-row-resize"
      );
    });

    it("applies handleClassName", () => {
      const { container } = render(
        <SplitPane handleClassName="custom-handle">
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      expect(container.querySelector(".custom-handle")).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("disables resize handle when disabled", () => {
      render(
        <SplitPane disabled>
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      expect(screen.getByRole("separator")).toHaveAttribute("tabIndex", "-1");
    });

    it("applies disabled styles", () => {
      const { container } = render(
        <SplitPane disabled>
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      expect(container.querySelector(".split-pane-handle")).toHaveClass(
        "pointer-events-none"
      );
    });
  });

  describe("callbacks", () => {
    it("calls onResizeStart when resizing begins", () => {
      const onResizeStart = jest.fn();
      render(
        <SplitPane onResizeStart={onResizeStart}>
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      const handle = screen.getByRole("separator");
      fireEvent.mouseDown(handle);

      expect(onResizeStart).toHaveBeenCalled();
    });

    it("calls onResizeEnd when resizing ends", () => {
      const onResizeEnd = jest.fn();
      render(
        <SplitPane onResizeEnd={onResizeEnd}>
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      const handle = screen.getByRole("separator");
      fireEvent.mouseDown(handle);

      act(() => {
        document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });

      expect(onResizeEnd).toHaveBeenCalled();
    });
  });

  describe("keyboard navigation", () => {
    it("supports arrow key navigation", () => {
      const onResize = jest.fn();
      render(
        <SplitPane onResize={onResize} defaultSize={200}>
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      const handle = screen.getByRole("separator");
      handle.focus();

      fireEvent.keyDown(handle, { key: "ArrowRight" });

      expect(onResize).toHaveBeenCalled();
    });

    it("supports Home key to minimize", () => {
      const onResize = jest.fn();
      render(
        <SplitPane onResize={onResize} defaultSize={200} minSize={50}>
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      const handle = screen.getByRole("separator");
      handle.focus();

      fireEvent.keyDown(handle, { key: "Home" });

      expect(onResize).toHaveBeenCalledWith(50);
    });
  });

  describe("double-click behavior", () => {
    it("resets to default size on double-click", () => {
      const onResize = jest.fn();
      render(
        <SplitPane onResize={onResize} defaultSize={200}>
          <div>Left</div>
          <div>Right</div>
        </SplitPane>
      );

      const handle = screen.getByRole("separator");
      fireEvent.doubleClick(handle);

      expect(onResize).toHaveBeenCalled();
    });
  });
});

describe("useSplitPane hook", () => {
  function TestComponent() {
    const { size, setSize, handleProps, containerRef } = useSplitPane({
      defaultSize: 300,
      minSize: 100,
    });

    return (
      <div ref={containerRef} style={{ width: 800, height: 400 }}>
        <div data-cy="size">{size}</div>
        <button onClick={() => setSize(400)}>Set 400</button>
        <div {...handleProps}>Handle</div>
      </div>
    );
  }

  it("provides initial size", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("size")).toHaveTextContent("300");
  });

  it("allows setting size", () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText("Set 400"));

    expect(screen.getByTestId("size")).toHaveTextContent("400");
  });

  it("provides handle props", () => {
    render(<TestComponent />);

    const handle = screen.getByText("Handle");
    expect(handle).toHaveAttribute("role", "separator");
    expect(handle).toHaveAttribute("tabIndex", "0");
  });
});
