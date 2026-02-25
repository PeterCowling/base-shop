import * as React from "react";
import { configure,render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { Drawer, DrawerContent, DrawerDescription,DrawerTitle, DrawerTrigger } from "../drawer";

configure({ testIdAttribute: "data-cy" });

describe("Drawer visuals", () => {
  it("renders right-side panel with correct classes", async () => {
    const { container } = render(
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
    expect(cls).toMatch(/overflow-x-hidden/);
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
    expect(cls).toMatch(/overflow-x-hidden/);
  });

  it("supports content shape and radius variants", async () => {
    const { rerender } = render(
      <Drawer open>
        <DrawerContent side="right" data-cy="content" shape="soft">
          <DrawerTitle className="sr-only">Title</DrawerTitle>
          <DrawerDescription className="sr-only">Desc</DrawerDescription>
        </DrawerContent>
      </Drawer>
    );

    const softContent = await screen.findByTestId("content");
    expect(softContent.className).toMatch(/rounded-md/);

    rerender(
      <Drawer open>
        <DrawerContent side="right" data-cy="content" shape="pill" radius="lg">
          <DrawerTitle className="sr-only">Title</DrawerTitle>
          <DrawerDescription className="sr-only">Desc</DrawerDescription>
        </DrawerContent>
      </Drawer>
    );

    const radiusOverrideContent = await screen.findByTestId("content");
    expect(radiusOverrideContent.className).toMatch(/rounded-lg/);
    expect(radiusOverrideContent.className).not.toMatch(/rounded-full/);
  });
});
