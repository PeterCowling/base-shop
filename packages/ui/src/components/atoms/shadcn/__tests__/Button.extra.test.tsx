import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("../../primitives/button", () => ({
  Button: jest.fn(({ asChild, ...props }) => <button {...props} />),
}));

import { Button } from "../Button";
import { Button as BaseButton } from "../../primitives/button";

describe("Button (shadcn) extra", () => {
  it("uses BaseButton for non-destructive variants and applies size=icon", () => {
    render(<Button size="icon" aria-label="icon" />);
    const base = screen.getByRole("button", { name: "icon" });
    expect(BaseButton).toHaveBeenCalled();
    expect(base.className).toMatch(/h-10/);
    expect(base.className).toMatch(/w-12/);
  });
});
