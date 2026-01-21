import React from "react";
import { render, waitFor } from "@testing-library/react";

import type { UpgradeComponent } from "@acme/types";

import ComponentPreview from "../src/components/ComponentPreview";

describe("ComponentPreview import failures", () => {
  it("renders nothing and does not crash when dynamic import fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      // No __UPGRADE_MOCKS__ set so both dynamic imports will fail & be caught
      const component: UpgradeComponent = {
        componentName: "Missing",
        file: "Missing.tsx",
        newChecksum: "new",
      } as UpgradeComponent;

      const { container } = render(<ComponentPreview component={component} />);
      // Nothing rendered (no mock provided, old/new both unavailable)
      expect(container.querySelector("button")).toBeNull();

      await waitFor(
        () => {
          expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );

      const matchingCall = consoleErrorSpy.mock.calls.find(
        ([first, second]) => first === "Failed to load component" && second === "Missing",
      );

      expect(matchingCall).toBeDefined();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
