import { render, screen } from "@testing-library/react";

describe("UI sanity check", () => {
  it("renders static text", () => {
    render(<span>Hello Jest</span>);
    expect(screen.getByText("Hello Jest")).toBeInTheDocument();
  });
});
