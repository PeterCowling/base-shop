import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  it("logs error when dynamic import fails", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(<ComponentPreview component={component} />);

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(spy.mock.calls[0][0]).toBe("Failed to load component");
    expect(spy.mock.calls[0][1]).toBe(component.componentName);

    spy.mockRestore();
  });

  it("renders component with provided props", async () => {
    const NewComp = ({ message }: { message: string }) => (
      <div>{message}</div>
    );
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@ui/components/MyComp": NewComp,
    };

    render(
      <ComponentPreview
        component={component}
        componentProps={{ message: "Hello Props" }}
      />
    );

    expect(
      await screen.findByText("Hello Props")
    ).toBeInTheDocument();
  });

  it("does not show Compare button without backup component", async () => {
    const NewComp = () => <div>New Component</div>;
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@ui/components/MyComp": NewComp,
    };

    render(<ComponentPreview component={component} />);

    expect(await screen.findByText("New Component")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Compare" })
    ).not.toBeInTheDocument();
  });

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

  it("switches between side and toggle modes", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));

    expect(await screen.findByText("New Component")).toBeInTheDocument();
    expect(screen.queryByText("Old Component")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Side by side" }));

    expect(await screen.findByText("New Component")).toBeInTheDocument();
    expect(await screen.findByText("Old Component")).toBeInTheDocument();
  });

  it("toggles screenshot mode between versions", async () => {
    const NewComp = () => <div>New Component</div>;
    const OldComp = () => <div>Old Component</div>;
    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@ui/components/MyComp": NewComp,
      "@ui/components/MyComp.bak": OldComp,
    };

    render(<ComponentPreview component={component} />);

    fireEvent.click(await screen.findByRole("button", { name: "Compare" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));

    fireEvent.click(screen.getByRole("button", { name: "Show old" }));
    expect(await screen.findByText("Old Component")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show new" }));
    expect(await screen.findByText("New Component")).toBeInTheDocument();
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

