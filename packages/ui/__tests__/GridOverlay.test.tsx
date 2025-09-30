import { render } from "@testing-library/react";
import GridOverlay from "../src/components/cms/page-builder/GridOverlay";

describe("GridOverlay", () => {
  const cases = [
    { gridCols: 5, expected: 5 },
    { gridCols: 0, expected: 1 },
    { gridCols: -3, expected: 1 },
    { gridCols: 3.7, expected: 3 },
    { gridCols: NaN, expected: 1 },
    { gridCols: Infinity, expected: 1 },
  ];

  test.each(cases)("renders %s columns", ({ gridCols, expected }) => {
    const { container } = render(<GridOverlay gridCols={gridCols} />);
    const grid = container.querySelector(
      '[data-cy="pb-grid-overlay"]'
    ) as HTMLElement;

    expect(grid).toBeTruthy();

    expect(grid.children).toHaveLength(expected);
    expect(grid).toHaveStyle(`grid-template-columns: repeat(${expected}, 1fr)`);
  });
});
