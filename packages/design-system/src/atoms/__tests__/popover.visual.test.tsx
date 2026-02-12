import "../../../../../../test/resetNextMocks";

import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { Button } from "../../primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover";

describe("Popover visuals", () => {
  it("uses panel surface and border tokens", async () => {
    const { container } = render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open popover</Button>
        </PopoverTrigger>
        <PopoverContent data-cy="content">
          <div>Panel</div>
        </PopoverContent>
      </Popover>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open popover/i }));
    const content = await screen.findByTestId("content");
    const cls = content.className;
    expect(cls).toMatch(/bg-panel/);

    expect(cls).toMatch(/border-border-2/);
    expect(cls).toMatch(/shadow-elevation/);
  });
});
