import * as React from "react";
import { configure,render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Drawer, DrawerContent, DrawerDescription,DrawerTitle, DrawerTrigger } from "../drawer";

configure({ testIdAttribute: "data-cy" });

describe("Drawer visuals", () => {
  it("renders right-side panel with correct classes", async () => {
    render(
      <Drawer>
        <DrawerTrigger asChild>
          <button>Open</button>
        </DrawerTrigger>
        <DrawerContent side="right" width="w-64" data-cy="content">
          <DrawerTitle className="sr-only">Title</DrawerTitle>
          <DrawerDescription className="sr-only">Desc</DrawerDescription>
        </DrawerContent>
      </Drawer>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open/i }));
    const content = await screen.findByTestId("content");
    const cls = content.className;
    expect(cls).toMatch(/bg-panel/);
    expect(cls).toMatch(/right-0/);
    expect(cls).toMatch(/border-l/);
    expect(cls).toMatch(/border-border-2/);
  });

  it("renders left-side panel with correct classes", async () => {
    render(
      <Drawer>
        <DrawerTrigger asChild>
          <button>Open left</button>
        </DrawerTrigger>
        <DrawerContent side="left" width="w-64" data-cy="content">
          <DrawerTitle className="sr-only">Title</DrawerTitle>
          <DrawerDescription className="sr-only">Desc</DrawerDescription>
        </DrawerContent>
      </Drawer>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open left/i }));
    const content = await screen.findByTestId("content");
    const cls = content.className;
    expect(cls).toMatch(/bg-panel/);
    expect(cls).toMatch(/left-0/);
    expect(cls).toMatch(/border-r/);
    expect(cls).toMatch(/border-border-2/);
  });
});
