import "../../../../../../../test/resetNextMocks";

import * as React from "react";
import { render, screen } from "@testing-library/react";

import { Button as BaseButton } from "../../primitives/button";
import { Button } from "../Button";

jest.mock("../../primitives/button", () => ({
  Button: jest.fn((props) => <button data-testid="base-button" {...props} />),
}));

describe("Button (shadcn)", () => {
  it("renders destructive variant without BaseButton and supports asChild", () => {
    render(
      <Button variant="destructive" asChild>
        <a href="/">Delete</a>
      </Button>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveClass("bg-destructive", "text-destructive-foreground");
    expect(link).not.toHaveAttribute("data-token");
    expect(BaseButton).not.toHaveBeenCalled();
    expect(screen.queryByTestId("base-button")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
