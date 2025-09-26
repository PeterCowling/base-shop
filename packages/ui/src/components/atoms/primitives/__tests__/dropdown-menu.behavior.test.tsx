import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { Button } from "../button";

describe("DropdownMenu behavior", () => {
  it("invokes onSelect for items and closes on outside click", async () => {
    const onSelect = jest.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent data-cy="content">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onSelect}>Choose me</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Other</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open/i }));
    expect(await screen.findByTestId("content")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: /choose me/i }));
    expect(onSelect).toHaveBeenCalled();
    // Click outside should close
    await user.click(document.body);
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("opens a submenu on hover and closes on Escape", async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger data-cy="sub-trigger">More…</DropdownMenuSubTrigger>
            <DropdownMenuSubContent data-cy="sub-content">
              <DropdownMenuItem>Deep item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open/i }));
    await user.hover(screen.getByTestId("sub-trigger"));
    expect(await screen.findByTestId("sub-content")).toBeInTheDocument();
    // Press Escape should close all menus
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("sub-content")).toBeNull();
  });
});

