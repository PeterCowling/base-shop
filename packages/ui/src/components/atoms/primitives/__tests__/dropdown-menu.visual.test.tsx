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
  DropdownMenuTrigger,
} from "../dropdown-menu";

import { Button } from "../button";

describe("DropdownMenu visuals", () => {
  it("uses panel surface and border tokens", async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" data-cy="content">
          <DropdownMenuLabel>Menu</DropdownMenuLabel>
          <DropdownMenuItem>One</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Two</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open/i }));
    const content = await screen.findByTestId("content");
    const cls = content.className;
    expect(cls).toMatch(/bg-panel/);
    expect(cls).toMatch(/border-border-2/);
    expect(cls).toMatch(/shadow-elevation/);
  });
});
