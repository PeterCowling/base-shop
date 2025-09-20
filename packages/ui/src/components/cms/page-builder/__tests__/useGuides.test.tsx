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
        <div data-cy="s3" />
      </div>
    );
  }

  const { getByTestId } = render(<Wrapper />);
  const s1 = getByTestId("s1") as HTMLElement;
  const s2 = getByTestId("s2") as HTMLElement;
  const s3 = getByTestId("s3") as HTMLElement;
  const target = getByTestId("target") as HTMLElement;

  Object.defineProperty(s1, "offsetLeft", { value: 10, writable: true });
  Object.defineProperty(s1, "offsetTop", { value: 5, writable: true });
  Object.defineProperty(s1, "offsetWidth", { value: 40, writable: true });
  Object.defineProperty(s1, "offsetHeight", { value: 10, writable: true });

  Object.defineProperty(s2, "offsetLeft", { value: 60, writable: true });
  Object.defineProperty(s2, "offsetTop", { value: 20, writable: true });
  Object.defineProperty(s2, "offsetWidth", { value: 20, writable: true });
  Object.defineProperty(s2, "offsetHeight", { value: 10, writable: true });

  Object.defineProperty(s3, "offsetLeft", { value: 110, writable: true });
  Object.defineProperty(s3, "offsetTop", { value: 35, writable: true });
  Object.defineProperty(s3, "offsetWidth", { value: 20, writable: true });
  Object.defineProperty(s3, "offsetHeight", { value: 15, writable: true });

  // Give the current element its own dimensions which should be ignored
  Object.defineProperty(target, "offsetLeft", { value: 200, writable: true });
  Object.defineProperty(target, "offsetTop", { value: 100, writable: true });
  Object.defineProperty(target, "offsetWidth", { value: 25, writable: true });
  Object.defineProperty(target, "offsetHeight", { value: 30, writable: true });

  computeSiblingEdges();

  // Centerlines may be included; ensure sibling edges are present
  expect(siblingEdgesRef.current.vertical).toEqual(
    expect.arrayContaining([10, 50, 60, 80, 110, 130])
  );
  expect(siblingEdgesRef.current.horizontal).toEqual(
    expect.arrayContaining([5, 15, 20, 30, 35, 50])
  );

  // Ensure the current element's edges were not included
  expect(siblingEdgesRef.current.vertical).not.toContain(200);
  expect(siblingEdgesRef.current.vertical).not.toContain(225);
  expect(siblingEdgesRef.current.horizontal).not.toContain(100);
  expect(siblingEdgesRef.current.horizontal).not.toContain(130);
});
