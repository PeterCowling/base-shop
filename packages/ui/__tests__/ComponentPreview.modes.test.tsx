import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { UpgradeComponent } from "@acme/types";

import ComponentPreview from "../src/components/ComponentPreview";

describe("ComponentPreview advanced modes and error handling", () => {
  afterEach(() => {
    delete (globalThis as any).__UPGRADE_MOCKS__;
  });

  it("does not show compare when no backup component and renders new only", async () => {
    const NewComp = () => <div>Only New</div>;
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@acme/ui/components/Only": NewComp,
    };

    const component: UpgradeComponent = {
      componentName: "Only",
      file: "Only.tsx",
      newChecksum: "new",
    } as UpgradeComponent;

    render(<ComponentPreview component={component} />);

    expect(await screen.findByText("Only New")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Compare" })).toBeNull();
  });

  it("toggles compare modes (side/toggle) and switches visible component", async () => {
    const NewComp = () => <div>NewC</div>;
    const OldComp = () => <div>OldC</div>;
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@acme/ui/components/Thing": NewComp,
      "@acme/ui/components/Thing.bak": OldComp,
    };

    const component: UpgradeComponent = {
      componentName: "Thing",
      file: "Thing.tsx",
      newChecksum: "new",
    } as UpgradeComponent;

    render(<ComponentPreview component={component} />);
    fireEvent.click(await screen.findByRole("button", { name: "Compare" }));

    // Default is side-by-side
    expect(await screen.findByText("NewC")).toBeInTheDocument();
    expect(await screen.findByText("OldC")).toBeInTheDocument();

    // Switch to toggle mode and flip between versions
    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    const toggleBtn = screen.getByRole("button", { name: "Show old" });
    fireEvent.click(toggleBtn);
    expect(await screen.findByText("OldC")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show new" }));
    expect(await screen.findByText("NewC")).toBeInTheDocument();
  });

  it("renders error boundary fallback when component throws", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      const Thrower = () => {
        throw new Error("boom");
      };
      (globalThis as any).__UPGRADE_MOCKS__ = {
        "@acme/ui/components/Boom": Thrower,
      };

      const component: UpgradeComponent = {
        componentName: "Boom",
        file: "Boom.tsx",
        newChecksum: "new",
      } as UpgradeComponent;

      render(<ComponentPreview component={component} />);

      expect(
        await screen.findByText("Failed to render preview")
      ).toBeInTheDocument();

      await waitFor(
        () => {
          expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(1);
        },
        { timeout: 3000 },
      );

      expect(
        consoleErrorSpy.mock.calls.some(([first]) =>
          typeof first === "string" && first.includes("Component preview failed"),
        ),
      ).toBe(true);
      expect(
        consoleErrorSpy.mock.calls.some(([, error]) => error instanceof Error && error.message === "boom"),
      ).toBe(true);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
