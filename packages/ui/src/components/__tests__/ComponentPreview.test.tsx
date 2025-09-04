import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ComponentPreview from "../ComponentPreview";
import type { UpgradeComponent } from "@acme/types";

describe("ComponentPreview", () => {
  afterEach(() => {
    delete (globalThis as any).__UPGRADE_MOCKS__;
  });

  const component: UpgradeComponent = {
    componentName: "MyComp",
    file: "MyComp.tsx",
  } as UpgradeComponent;

  it("renders the new component by default", async () => {
    const NewComp = () => <div>New Component</div>;
    const OldComp = () => <div>Old Component</div>;
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@ui/components/MyComp": NewComp,
      "@ui/components/MyComp.bak": OldComp,
    };

    render(<ComponentPreview component={component} />);

    expect(await screen.findByText("New Component")).toBeInTheDocument();
    expect(screen.queryByText("Old Component")).not.toBeInTheDocument();
  });

  it("shows components side by side when comparison is enabled", async () => {
    const NewComp = () => <div>New Component</div>;
    const OldComp = () => <div>Old Component</div>;
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@ui/components/MyComp": NewComp,
      "@ui/components/MyComp.bak": OldComp,
    };

    render(<ComponentPreview component={component} />);

    fireEvent.click(await screen.findByRole("button", { name: "Compare" }));

    expect(await screen.findByText("New Component")).toBeInTheDocument();
    expect(await screen.findByText("Old Component")).toBeInTheDocument();
  });

  it("toggles between versions in toggle mode", async () => {
    const NewComp = () => <div>New Component</div>;
    const OldComp = () => <div>Old Component</div>;
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@ui/components/MyComp": NewComp,
      "@ui/components/MyComp.bak": OldComp,
    };

    render(<ComponentPreview component={component} />);

    fireEvent.click(await screen.findByRole("button", { name: "Compare" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));

    const switchButton = screen.getByRole("button", { name: "Show old" });
    fireEvent.click(switchButton);
    expect(await screen.findByText("Old Component")).toBeInTheDocument();
    expect(screen.queryByText("New Component")).not.toBeInTheDocument();
  });

  it("shows fallback when component throws", async () => {
    const ErrorComp = () => {
      throw new Error("boom");
    };
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@ui/components/MyComp": ErrorComp,
    };

    render(<ComponentPreview component={component} />);

    expect(
      await screen.findByText("Failed to render preview")
    ).toBeInTheDocument();
  });
});

