import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type ErrorPageModule = typeof import("../../src/app/error");
type ErrorPageType = ErrorPageModule["default"];

let ErrorPage: ErrorPageType;

beforeAll(async () => {
  ({ default: ErrorPage } = await import("../../src/app/error"));
});

describe("ErrorPage", () => {
  it("renders default global error content", () => {
    render(<ErrorPage error={new Error("boom")} reset={jest.fn()} />);

    expect(
      screen.getByRole("heading", { name: "500 — Something went wrong" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please try again, or return to the homepage.")
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Go to homepage" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("calls reset when retry is pressed", async () => {
    const user = userEvent.setup();
    const reset = jest.fn();
    render(<ErrorPage error={new Error("boom")} reset={reset} />);

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
