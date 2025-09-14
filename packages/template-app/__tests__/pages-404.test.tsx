/** @jest-environment jsdom */
import { render } from "@testing-library/react";

describe("Pages Router 404 page", () => {
  it("renders message and link", () => {
    const NotFound = require("../src/pages/404").default;
    const { getByText } = render(<NotFound />);
    expect(getByText("404 — Page not found")).toBeInTheDocument();
    expect(getByText("Go to homepage")).toHaveAttribute("href", "/");
  });
});
