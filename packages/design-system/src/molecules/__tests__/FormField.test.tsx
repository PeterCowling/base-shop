import React from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { FormField } from "../FormField";

describe("FormField", () => {
  it("renders the provided label", async () => {
    render(
      <FormField label="Username">
        <input id="username" />
      </FormField>
    );

    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  it("shows a required asterisk when required", () => {
    render(
      <FormField label="Email" htmlFor="email" required>
        <input id="email" />
      </FormField>
    );

    const asterisk = screen.getByText("*");
    expect(asterisk).toBeInTheDocument();

    expect(asterisk).toHaveAttribute("aria-hidden", "true");
  });

  it("displays an error message when provided", () => {
    render(
      <FormField label="Password" error="Required field">
        <input id="password" />
      </FormField>
    );

    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("applies boxProps to class names and styles", () => {
    const { container } = render(
      <FormField
        label="Styled"
        width={200}
        height="h-5"
        padding="p-3"
        margin="m-4"
      >
        <input />
      </FormField>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("flex", "flex-col", "gap-1", "h-5", "p-3", "m-4");
    expect(wrapper).toHaveStyle({ width: "200px" });
  });
});
