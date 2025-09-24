import React from "react";
import { render } from "@testing-library/react";
import ComponentPreview from "../src/components/ComponentPreview";
import type { UpgradeComponent } from "@acme/types";

describe("ComponentPreview import failures", () => {
  it("renders nothing and does not crash when dynamic import fails", async () => {
    // No __UPGRADE_MOCKS__ set so both dynamic imports will fail & be caught
    const component: UpgradeComponent = {
      componentName: "Missing",
      file: "Missing.tsx",
    } as UpgradeComponent;

    const { container } = render(<ComponentPreview component={component} />);
    // Nothing rendered (no mock provided, old/new both unavailable)
    expect(container.querySelector("button")).toBeNull();
  });
});

