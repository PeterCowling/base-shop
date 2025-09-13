import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen, configure } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Slot } from "../slot";

configure({ testIdAttribute: "data-testid" });

describe("Slot", () => {
  it("forwards props and ref to child element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Slot ref={ref} className="forwarded" data-test="passed">
        <div data-testid="child" />
      </Slot>
    );
    const child = screen.getByTestId("child");
    expect(child).toHaveClass("forwarded");
    expect(child).toHaveAttribute("data-test", "passed");
    expect(ref.current).toBe(child);
  });

  it("returns null when children is not a valid element", () => {
    const { container } = render(<Slot>{"text"}</Slot>);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when children is null or undefined", () => {
    const { container: nullContainer } = render(<Slot>{null}</Slot>);
    const { container: undefinedContainer } = render(<Slot>{undefined}</Slot>);
    expect(nullContainer.firstChild).toBeNull();
    expect(undefinedContainer.firstChild).toBeNull();
  });

  it("merges props with child element without overwriting", () => {
    render(
      <Slot className="forwarded" data-test="slot" data-new="added">
        <div data-testid="child" className="existing" data-test="original" />
      </Slot>
    );
    const child = screen.getByTestId("child");
    expect(child).toHaveClass("existing");
    expect(child).toHaveClass("forwarded");
    expect(child).toHaveAttribute("data-test", "original");
    expect(child).toHaveAttribute("data-new", "added");
  });

  it("handles existing child ref along with Slot ref", () => {
    const slotRef = React.createRef<HTMLDivElement>();
    const childRef = React.createRef<HTMLDivElement>();
    render(
      <Slot ref={slotRef}>
        <div data-testid="child" ref={childRef} />
      </Slot>
    );
    const child = screen.getByTestId("child");
    expect(slotRef.current).toBe(child);
    expect(childRef.current).toBe(child);
  });

  it("handles function refs along with Slot ref", () => {
    let slotNode: HTMLDivElement | null = null;
    let childNode: HTMLDivElement | null = null;
    const slotRef = (node: HTMLDivElement | null) => {
      slotNode = node;
    };
    const childRef = (node: HTMLDivElement | null) => {
      childNode = node;
    };
    render(
      <Slot ref={slotRef}>
        <div data-testid="child" ref={childRef} />
      </Slot>
    );
    const child = screen.getByTestId("child");
    expect(slotNode).toBe(child);
    expect(childNode).toBe(child);
  });

  it("passes event handlers through to the child", async () => {
    const handleClick = jest.fn();
    render(
      <Slot onClick={handleClick}>
        <button data-testid="child">child</button>
      </Slot>
    );
    await userEvent.click(screen.getByTestId("child"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
