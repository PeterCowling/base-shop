import "../../../../../../../test/resetNextMocks";

import * as React from "react";
import { render, screen } from "@testing-library/react";

import { Button as BaseButton } from "../../primitives/button";
import { Button } from "../Button";

jest.mock("../../primitives/button", () => ({
  Button: jest.fn(({ asChild, ...props }) => <button {...props} />),
}));

describe("Button (shadcn) extra", () => {
  it("uses BaseButton for non-destructive variants and applies size=icon", () => {
    render(<Button size="icon" aria-label="icon" />);
    const base = screen.getByRole("button", { name: "icon" });
    expect(BaseButton).toHaveBeenCalled();
    expect(base.className).toMatch(/h-10/);
    expect(base.className).toMatch(/w-12/);
  });
});
