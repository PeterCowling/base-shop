import "../../../../../../../test/resetNextMocks";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../dropdown-menu";

describe("DropdownMenu accessibility helpers", () => {
  it("portals content into a provided container", async () => {
    const portalContainer = document.createElement("div");
    document.body.appendChild(portalContainer);
    const originalPortal = DropdownMenuPrimitive.Portal;
    const portalCalls: Array<Record<string, unknown>> = [];
    const portalSpy = jest
      .spyOn(DropdownMenuPrimitive, "Portal")
      .mockImplementation((props: any) => {
        portalCalls.push(props);
        return React.createElement(originalPortal, props);
      });

    try {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            container={portalContainer}
            data-cy="menu-content"
          >
            <DropdownMenuCheckboxItem checked>Checkbox</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /open/i }));
      const content = await screen.findByTestId("menu-content");
      expect(content).toBeInTheDocument();

      expect(portalCalls[0]?.container).toBe(portalContainer);
    } finally {
      portalSpy.mockRestore();
      portalContainer.remove();
    }
  });

  it("renders checkbox, radio, and shortcut helpers with merged classes", async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked className="custom-checkbox">
            Checkbox choice
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="one">
            <DropdownMenuRadioItem value="one" className="custom-radio">
              Radio choice
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              inset
              className="custom-sub-trigger"
              data-cy="sub-trigger"
            >
              More options
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              className="custom-sub-content"
              data-cy="sub-content"
            >
              <DropdownMenuLabel inset className="custom-label">
                Tools
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="custom-separator" />
              <DropdownMenuItem inset className="custom-item">
                Nested choice
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>
            Save
            <DropdownMenuShortcut className="custom-shortcut">
              ⌘S
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open/i }));

    const checkboxText = await screen.findByText(/checkbox choice/i);
    const checkbox = checkboxText.closest("[data-radix-mock='CheckboxItem']");
    expect(checkbox).not.toBeNull();
    expect(checkbox?.className).toContain("custom-checkbox");
    expect(checkbox?.querySelector("svg")).toBeInTheDocument();

    const radioText = screen.getByText(/radio choice/i);
    const radio = radioText.closest("[data-radix-mock='RadioItem']");
    expect(radio).not.toBeNull();
    expect(radio?.className).toContain("custom-radio");
    expect(radio?.querySelector("svg")).toBeInTheDocument();

    const shortcut = screen.getByText("⌘S");
    expect(shortcut.className).toContain("custom-shortcut");
    expect(shortcut.className).toContain("ms-auto");

    const subTrigger = screen.getByTestId("sub-trigger");
    expect(subTrigger.className).toContain("custom-sub-trigger");
    expect(subTrigger.className).toContain("ps-8");
    expect(subTrigger.querySelector("svg")).toBeInTheDocument();

    await user.hover(subTrigger);
    const subContent = await screen.findByTestId("sub-content");
    expect(subContent.className).toContain("custom-sub-content");

    const label = screen.getByText("Tools").closest("[data-radix-mock='Label']");
    expect(label).not.toBeNull();
    expect(label?.className).toContain("custom-label");
    expect(label?.className).toContain("ps-8");

    const separator = subContent.querySelector("[data-radix-mock='Separator']");
    expect(separator).not.toBeNull();
    expect(separator?.className).toContain("custom-separator");
  });
});
