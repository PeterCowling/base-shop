/** @jest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

describe("ComponentPreview", () => {
  beforeEach(() => {
    (globalThis as any).__UPGRADE_MOCKS__ = {};
  });

  afterEach(() => {
    delete (globalThis as any).__UPGRADE_MOCKS__;
  });

  function registerMock(path: string, comp: React.ComponentType) {
    (globalThis as any).__UPGRADE_MOCKS__[path] = comp;
  }

  it("renders new component and supports compare + toggle modes", async () => {
    const New = ({ label }: { label: string }) => <div>new:{label}</div>;
    const Old = ({ label }: { label: string }) => <div>old:{label}</div>;

    registerMock("@ui/components/MyComp", New);
    registerMock("@ui/components/MyComp.bak", Old);

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
    const Boom = () => {
      throw new Error("boom");
    };
    registerMock("@ui/components/Boomy", Boom);

    const { default: ComponentPreview } = await import("../ComponentPreview");
    render(
      <ComponentPreview
        component={{ id: "2", type: "Y", file: "Boomy.tsx", componentName: "Boomy" } as any}
      />
    );

    expect(await screen.findByText(/Failed to render preview/)).toBeInTheDocument();
  });
});

