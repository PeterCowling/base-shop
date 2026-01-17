import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ComponentPreview from "../src/components/ComponentPreview";
import type { UpgradeComponent } from "@acme/types";

describe("ComponentPreview", () => {
  afterEach(() => {
    delete (globalThis as any).__UPGRADE_MOCKS__;
  });

  const component: UpgradeComponent = {
    componentName: "MyComp",
    file: "MyComp.tsx",
  } as UpgradeComponent;

  it("renders new component without comparison controls when no legacy component", async () => {
    const NewComp = () => <div>New Component</div>;
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@acme/ui/components/MyComp": NewComp,
    };

    render(<ComponentPreview component={component} />);

    expect(await screen.findByText("New Component")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Compare" })).not.toBeInTheDocument();
  });

  it("toggles comparison panel when Compare is clicked", async () => {
    const NewComp = () => <div>New Component</div>;
    const OldComp = () => <div>Old Component</div>;
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@acme/ui/components/MyComp": NewComp,
      "@acme/ui/components/MyComp.bak": OldComp,
    };

    render(<ComponentPreview component={component} />);

    const compareButton = await screen.findByRole("button", { name: "Compare" });
    fireEvent.click(compareButton);
    expect(await screen.findByText("Side by side")).toBeInTheDocument();

    const hideButton = screen.getByRole("button", { name: "Hide comparison" });
    fireEvent.click(hideButton);
    expect(screen.queryByText("Side by side")).not.toBeInTheDocument();
  });

  it("renders correct components in side and toggle modes", async () => {
    const NewComp = () => <div>New Component</div>;
    const OldComp = () => <div>Old Component</div>;
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@acme/ui/components/MyComp": NewComp,
      "@acme/ui/components/MyComp.bak": OldComp,
    };

    render(<ComponentPreview component={component} />);

    fireEvent.click(await screen.findByRole("button", { name: "Compare" }));

    // Side by side mode shows both components
    expect(await screen.findByText("New Component")).toBeInTheDocument();
    expect(await screen.findByText("Old Component")).toBeInTheDocument();

    // Switch to toggle mode
    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    expect(await screen.findByText("New Component")).toBeInTheDocument();
    expect(screen.queryByText("Old Component")).not.toBeInTheDocument();
  });

  it("switches between versions in toggle mode", async () => {
    const NewComp = () => <div>New Component</div>;
    const OldComp = () => <div>Old Component</div>;
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@acme/ui/components/MyComp": NewComp,
      "@acme/ui/components/MyComp.bak": OldComp,
    };

    render(<ComponentPreview component={component} />);

    fireEvent.click(await screen.findByRole("button", { name: "Compare" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));

    const switchButton = screen.getByRole("button", { name: "Show old" });
    fireEvent.click(switchButton);
    expect(await screen.findByText("Old Component")).toBeInTheDocument();
    expect(screen.queryByText("New Component")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show new" }));
    expect(await screen.findByText("New Component")).toBeInTheDocument();
    expect(screen.queryByText("Old Component")).not.toBeInTheDocument();
  });
});

