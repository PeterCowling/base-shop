import React from "react";
import { render, waitFor } from "@testing-library/react";
import ComponentPreview from "../src/components/ComponentPreview";
import type { UpgradeComponent } from "@acme/types";

describe("ComponentPreview import failures", () => {
  it("renders nothing and does not crash when dynamic import fails", async () => {
    const consoleErrorMock = console.error as jest.MockedFunction<typeof console.error>;
    const originalConsoleImpl = consoleErrorMock.getMockImplementation();
    const initialCallCount = consoleErrorMock.mock.calls.length;
    consoleErrorMock.mockImplementation(() => {});

    try {
      // No __UPGRADE_MOCKS__ set so both dynamic imports will fail & be caught
      const component: UpgradeComponent = {
        componentName: "Missing",
        file: "Missing.tsx",
      } as UpgradeComponent;

      const { container } = render(<ComponentPreview component={component} />);
      // Nothing rendered (no mock provided, old/new both unavailable)
      expect(container.querySelector("button")).toBeNull();

      await waitFor(
        () => {
          expect(consoleErrorMock.mock.calls.length).toBeGreaterThan(initialCallCount);
        },
        { timeout: 3000 },
      );

      const newCalls = consoleErrorMock.mock.calls.slice(initialCallCount);

      const matchingCall = newCalls.find(
        ([first, second]) => first === "Failed to load component" && second === "Missing",
      );

      expect(matchingCall).toBeDefined();
    } finally {
      consoleErrorMock.mockImplementation(originalConsoleImpl ?? (() => {}));
    }
  });
});

