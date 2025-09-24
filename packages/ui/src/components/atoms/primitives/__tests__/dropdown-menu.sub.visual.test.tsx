import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen, configure } from "@testing-library/react";
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

configure({ testIdAttribute: "data-cy" });

describe("DropdownMenu submenu visuals", () => {
  it("uses panel surface for SubContent as well", async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger data-cy="sub-trigger">Move to…</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40" data-cy="sub-content">
              <DropdownMenuItem>Inbox</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open/i }));
    await user.hover(screen.getByTestId("sub-trigger"));
    const sub = await screen.findByTestId("sub-content");
    const cls = sub.className;
    expect(cls).toMatch(/bg-panel/);
    expect(cls).toMatch(/border-border-2/);
    expect(cls).toMatch(/shadow-elevation/);
  });
});

