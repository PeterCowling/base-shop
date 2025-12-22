import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "@/components/ErrorBoundary";
import { withErrorBoundary } from "@/hoc/withErrorBoundary";
import { renderWithProviders } from "./testUtils";

const Thrower = () => {
  throw new Error("Boom");
};

describe("ErrorBoundary", () => {
  it("renders fallback UI and reloads", async () => {
    const user = userEvent.setup();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const reload = jest.fn();
    Object.defineProperty(window, "location", {
      value: { reload },
      writable: true,
    });

    renderWithProviders(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reload).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("supports HOC wrapping", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const Safe = withErrorBoundary(Thrower, { fallback: <div>Fallback</div> });
    render(<Safe />);
    expect(screen.getByText("Fallback")).toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
