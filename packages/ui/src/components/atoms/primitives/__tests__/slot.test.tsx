import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen, configure } from "@testing-library/react";
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
});
