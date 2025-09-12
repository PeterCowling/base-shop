import { render, screen } from "@testing-library/react";
import React from "react";
import { FormField } from "./FormField";

describe("FormField required field", () => {
  it("renders asterisk and error message when required and errored", () => {
    render(
      <FormField label="Email" htmlFor="email" required error="Email is required">
        <input id="email" />
      </FormField>
    );

    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
  });
});
