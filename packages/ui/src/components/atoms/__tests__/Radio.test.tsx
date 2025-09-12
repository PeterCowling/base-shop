import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { Radio } from "../Radio";

describe("Radio", () => {
  it("renders label text when label prop is provided", () => {
    render(<Radio label="A" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders children when label prop is absent", () => {
    render(<Radio>B</Radio>);
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
