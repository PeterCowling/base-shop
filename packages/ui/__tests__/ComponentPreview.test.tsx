import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ComponentPreview from "../src/components/ComponentPreview";
import type { UpgradeComponent } from "@acme/types";

describe("ComponentPreview", () => {
  afterEach(() => {
    delete (globalThis as any).__UPGRADE_MOCKS__;
  });

  it("renders component preview and triggers events", async () => {
    const NewComp = ({ onClick }: { onClick: () => void }) => (
      <button onClick={onClick}>New Component</button>
    );
    const OldComp = () => <div>Old Component</div>;
    const handleClick = jest.fn();

    (globalThis as any).__UPGRADE_MOCKS__ = {
      "@acme/ui/components/MyComp": NewComp,
      "@acme/ui/components/MyComp.bak": OldComp,
    };

    const component: UpgradeComponent = {
      componentName: "MyComp",
      file: "MyComp.tsx",
    } as UpgradeComponent;

    render(
      <ComponentPreview
        component={component}
        componentProps={{ onClick: handleClick }}
      />
    );

    const newButton = await screen.findByRole("button", {
      name: "New Component",
    });
    fireEvent.click(newButton);
    expect(handleClick).toHaveBeenCalledTimes(1);

    const compareButton = await screen.findByRole("button", { name: "Compare" });
    fireEvent.click(compareButton);
    expect(await screen.findByText("Old Component")).toBeInTheDocument();
  });
});
