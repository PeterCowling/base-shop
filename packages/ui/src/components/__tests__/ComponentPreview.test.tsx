/** @jest-environment jsdom */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

describe("ComponentPreview", () => {
  beforeEach(() => {
    (globalThis as any).__UPGRADE_MOCKS__ = {};
  });

  afterEach(() => {
    delete (globalThis as any).__UPGRADE_MOCKS__;
  });

  function registerMock(path: string, comp: React.ComponentType<Record<string, unknown>>) {
    (globalThis as any).__UPGRADE_MOCKS__[path] = comp;
  }

  it("renders new component and supports compare + toggle modes", async () => {
    const New = ({ label }: Record<string, unknown>) => <div>new:{String(label)}</div>;
    const Old = ({ label }: Record<string, unknown>) => <div>old:{String(label)}</div>;

    registerMock("@acme/ui/components/MyComp", New);
    registerMock("@acme/ui/components/MyComp.bak", Old);

    const { default: ComponentPreview } = await import("../ComponentPreview");

    render(
      <ComponentPreview
        component={{ id: "1", type: "X", file: "MyComp.tsx", componentName: "MyComp" } as any}
        componentProps={{ label: "A" }}
      />
    );

    expect(await screen.findByText("new:A")).toBeInTheDocument();

    // Enable compare (side-by-side)
    fireEvent.click(screen.getByRole("button", { name: /compare/i }));
    expect(await screen.findByText("old:A")).toBeInTheDocument();

    // Switch to toggle mode and flip shown component
    fireEvent.click(screen.getByRole("button", { name: /toggle/i }));
    fireEvent.click(screen.getByRole("button", { name: /show old/i }));
    expect(await screen.findByText("old:A")).toBeInTheDocument();
  });

  it("shows error boundary fallback when new component throws", async () => {
    const originalConsoleError = console.error;
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation(() => {});
    const initialCallCount = consoleErrorMock.mock.calls.length;

    try {
      const Boom = () => {
        throw new Error("boom");
      };
      registerMock("@acme/ui/components/Boomy", Boom);

      const { default: ComponentPreview } = await import("../ComponentPreview");
      render(
        <ComponentPreview
          component={{ id: "2", type: "Y", file: "Boomy.tsx", componentName: "Boomy" } as any}
        />
      );

      expect(await screen.findByText(/Failed to render preview/)).toBeInTheDocument();

      await waitFor(
        () => {
          expect(consoleErrorMock.mock.calls.length).toBeGreaterThan(initialCallCount + 1);
        },
        { timeout: 3000 },
      );

      const newCalls = consoleErrorMock.mock.calls.slice(initialCallCount);

      expect(
        newCalls.some(([first]) =>
          typeof first === "string" && first.includes("Component preview failed"),
        ),
      ).toBe(true);
      expect(
        newCalls.some(([, error]) => error instanceof Error && error.message === "boom"),
      ).toBe(true);
    } finally {
      consoleErrorMock.mockRestore();
      console.error = originalConsoleError;
    }
  });
});
