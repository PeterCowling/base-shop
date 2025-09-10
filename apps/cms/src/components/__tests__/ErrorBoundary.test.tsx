import { render } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary";

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>ok</div>
      </ErrorBoundary>
    );
    expect(getByText("ok")).toBeInTheDocument();
  });

  it("shows fallback when child throws", () => {
    const Thrower = () => {
      throw new Error("boom");
    };
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { getByText } = render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(getByText(/Something went wrong/)).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("renders custom fallback when provided", () => {
    const Thrower = () => {
      throw new Error("boom");
    };
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { getByText } = render(
      <ErrorBoundary fallback={<div>custom error</div>}>
        <Thrower />
      </ErrorBoundary>
    );
    expect(getByText("custom error")).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
