import "../../../../../../../test/resetNextMocks";

import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";

import { LONG_SENTENCE_WITH_TOKEN, LONG_UNBROKEN_TOKEN, LONG_URL } from "./fixtures/longContent";

describe("DropdownMenu visuals", () => {
  it("uses panel surface and border tokens", async () => {
    const { container } = render(
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

  it("applies content-bleed protection classes to menu items", async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent data-cy="content">
          <DropdownMenuItem data-cy="item">
            This is an intentionally long menu label that should wrap safely
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open/i }));

    const item = await screen.findByTestId("item");
    expect(item).toHaveClass("min-w-0");
    expect(item.querySelector("span.min-w-0.break-words")).not.toBeNull();
  });

  it("renders long token and URL content without dropping labels", async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent data-cy="content">
          <DropdownMenuItem data-cy="token-item">{LONG_UNBROKEN_TOKEN}</DropdownMenuItem>
          <DropdownMenuItem data-cy="url-item">{LONG_URL}</DropdownMenuItem>
          <DropdownMenuItem data-cy="sentence-item">{LONG_SENTENCE_WITH_TOKEN}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open/i }));

    const tokenItem = await screen.findByTestId("token-item");
    const urlItem = await screen.findByTestId("url-item");
    const sentenceItem = await screen.findByTestId("sentence-item");

    expect(tokenItem).toHaveClass("min-w-0", "break-words");
    expect(urlItem).toHaveClass("min-w-0", "break-words");
    expect(sentenceItem).toHaveClass("min-w-0", "break-words");
    expect(urlItem).toHaveTextContent(LONG_URL);
  });
});
