import { render, screen } from "@testing-library/react";

import ErrorPage from "../_error";

describe("ErrorPage", () => {
  it("renders status-specific content", () => {
    render(<ErrorPage statusCode={502} />);

    expect(
      screen.getByRole("heading", { name: "502 — Something went wrong" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please try again, or return to the homepage.")
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Go to homepage" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("falls back to the 500 copy when status code is omitted", () => {
    render(<ErrorPage />);

    expect(
      screen.getByRole("heading", { name: "500 — Something went wrong" })
    ).toBeInTheDocument();
  });
});

describe("ErrorPage.getInitialProps", () => {
  it("prefers the response status code when available", () => {
    const status = ErrorPage.getInitialProps({ res: { statusCode: 502 } });

    expect(status).toEqual({ statusCode: 502 });
  });

  it("falls back to the error status code when response is missing", () => {
    const status = ErrorPage.getInitialProps({ err: { statusCode: 503 } });

    expect(status).toEqual({ statusCode: 503 });
  });

  it("defaults to 500 when neither source provides a status", () => {
    const status = ErrorPage.getInitialProps({});

    expect(status).toEqual({ statusCode: 500 });
  });
});
