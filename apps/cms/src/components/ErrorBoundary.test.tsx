import { render } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

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
    jest.spyOn(console, "error").mockImplementation(() => {});
    const { getByText } = render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(getByText(/Something went wrong/)).toBeInTheDocument();
    (console.error as jest.Mock).mockRestore();
  });
});
