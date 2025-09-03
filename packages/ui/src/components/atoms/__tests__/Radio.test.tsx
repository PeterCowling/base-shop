import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { Radio } from "../Radio";

describe("Radio", () => {
  it("renders provided label", () => {
    render(<Radio label="A" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders children when no label is provided", () => {
    render(
      <Radio>
        <span>B</span>
      </Radio>
    );
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
