/** @jest-environment jsdom */
import { render } from "@testing-library/react";

describe("NotFound page", () => {
  it("renders message and link", async () => {
    const { default: NotFound } = await import("../src/app/not-found");
    const { getByText } = render(<NotFound />);
    expect(getByText("Page not found")).toBeInTheDocument();
    expect(getByText("Go to homepage")).toHaveAttribute("href", "/");
  });
});
