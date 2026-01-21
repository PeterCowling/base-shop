// packages/ui/src/components/cms/blocks/containers/__tests__/GridContainer.test.tsx
import React from "react";
import { render } from "@testing-library/react";

import GridContainer from "../../containers/GridContainer";

describe("GridContainer", () => {
  test("renders CSS grid with repeat columns and overrides by viewport", () => {
    const { container, rerender } = render(
      <GridContainer columns={3} rows={2} gap="8px" justifyItems="center" alignItems="end">x</GridContainer>
    );
    const host = container.firstElementChild as HTMLElement;
    expect(host.style.display).toBe("grid");
    expect(host.style.gridTemplateColumns).toContain("repeat(3");
    expect(host.style.gridTemplateRows).toContain("repeat(2");
    expect(host.style.gap).toBe("8px");
    expect(host.style.justifyItems).toBe("center");
    expect(host.style.alignItems).toBe("end");

    // Tablet override
    rerender(<GridContainer columns={3} columnsTablet={5} pbViewport="tablet">x</GridContainer>);
    expect((container.firstElementChild as HTMLElement).style.gridTemplateColumns).toContain("repeat(5");
  });

  test("autoFit uses minmax with provided minColWidth and areas/flow are applied", () => {
    const areas = '"a b"\n"c d"';
    const { container } = render(
      <GridContainer autoFit minColWidth="200px" areas={areas} autoFlow="row dense" equalizeRows>
        content
      </GridContainer>
    );
    const host = container.firstElementChild as HTMLElement;
    expect(host.style.gridTemplateColumns).toContain("auto-fit");
    expect(host.style.gridTemplateColumns).toContain("200px");
    expect(host.style.gridTemplateAreas).toContain("a b");
    expect(host.style.gridAutoFlow).toBe("row dense");
    expect(host.style.gridAutoRows).toBe("1fr");
  });
});

