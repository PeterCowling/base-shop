import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ErrorBoundary from "@/components/ErrorBoundary";

function Boom(): React.JSX.Element {
  throw new Error("Boom");
}

describe("<ErrorBoundary />", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <p>ok</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("shows fallback on error", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it("reloads the page when the retry button is pressed", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const reload = jest.fn();
    const originalLocation = window.location;
    const locationGetter = jest.spyOn(window, "location", "get");
    const mockLocation = Object.create(originalLocation) as Location;
    Object.defineProperty(mockLocation, "reload", {
      configurable: true,
      writable: true,
      value: reload,
    });
    locationGetter.mockReturnValue(mockLocation);

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    await userEvent.click(screen.getByRole("button", { name: /reload page/i }));
    expect(reload).toHaveBeenCalledTimes(1);

    locationGetter.mockRestore();
    spy.mockRestore();
  });
});