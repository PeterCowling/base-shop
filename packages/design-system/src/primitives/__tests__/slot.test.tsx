// packages/ui/src/components/atoms/primitives/__tests__/slot.test.tsx
import React from "react";
import { render } from "@testing-library/react";

import { Slot } from "../slot";

describe("Slot primitive", () => {
  test("merges props, className and forwards refs", () => {
    const parentRef = React.createRef<HTMLButtonElement>();
    const childRef = React.createRef<HTMLButtonElement>();

    const { container } = render(
      <Slot className="parent" ref={parentRef} id="outer" onClick={() => {}}>
        <button className="child" ref={childRef} data-id="button" />
      </Slot>
    );

    const btn = container.querySelector("button[data-id='button']")!;
    expect(btn).toBeTruthy();
    // className merged
    expect(btn.className).toContain("parent");
    expect(btn.className).toContain("child");
    // id prop applied from parent
    expect(btn.id).toBe("outer");
    // refs both receive the same node
    expect(parentRef.current).toBe(btn);
    expect(childRef.current).toBe(btn);
  });

  test("returns null when children is not a valid element", () => {
    const { container } = render(<Slot>text-only</Slot>);
    expect(container.firstChild).toBeNull();
  });
});

