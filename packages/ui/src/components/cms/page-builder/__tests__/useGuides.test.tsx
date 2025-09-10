import { render } from "@testing-library/react";
import React from "react";
import useGuides from "../useGuides";

test("computes sibling edge offsets", () => {
  let computeSiblingEdges: () => { vertical: number[]; horizontal: number[] };
  let siblingEdgesRef: React.MutableRefObject<{ vertical: number[]; horizontal: number[] }>;

  function Wrapper() {
    const ref = React.useRef<HTMLDivElement>(null);
    const hooks = useGuides(ref);
    computeSiblingEdges = hooks.computeSiblingEdges;
    siblingEdgesRef = hooks.siblingEdgesRef;
    return (
      <div>
        <div data-cy="s1" />
        <div ref={ref} data-cy="target" />
        <div data-cy="s2" />
      </div>
    );
  }

  const { getByTestId } = render(<Wrapper />);
  const s1 = getByTestId("s1") as HTMLElement;
  const s2 = getByTestId("s2") as HTMLElement;

  Object.defineProperty(s1, "offsetLeft", { value: 10, writable: true });
  Object.defineProperty(s1, "offsetTop", { value: 5, writable: true });
  Object.defineProperty(s1, "offsetWidth", { value: 40, writable: true });
  Object.defineProperty(s1, "offsetHeight", { value: 10, writable: true });

  Object.defineProperty(s2, "offsetLeft", { value: 60, writable: true });
  Object.defineProperty(s2, "offsetTop", { value: 20, writable: true });
  Object.defineProperty(s2, "offsetWidth", { value: 20, writable: true });
  Object.defineProperty(s2, "offsetHeight", { value: 10, writable: true });

  computeSiblingEdges();

  expect(siblingEdgesRef.current).toEqual({
    vertical: [10, 50, 60, 80],
    horizontal: [5, 15, 20, 30],
  });
});
