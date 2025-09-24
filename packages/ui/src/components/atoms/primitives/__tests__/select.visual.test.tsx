import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen, configure } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

configure({ testIdAttribute: "data-cy" });

describe("Select visuals", () => {
  it("uses panel surface and border tokens for content", async () => {
    render(
      <Select>
        <SelectTrigger data-cy="trigger">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent className="w-40" data-cy="content">
          <SelectItem value="one">One</SelectItem>
        </SelectContent>
      </Select>
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId("trigger"));
    const content = await screen.findByTestId("content");
    const cls = content.className;
    expect(cls).toMatch(/bg-panel/);
    expect(cls).toMatch(/border-border-2/);
    expect(cls).toMatch(/shadow-elevation/);
  });
});

