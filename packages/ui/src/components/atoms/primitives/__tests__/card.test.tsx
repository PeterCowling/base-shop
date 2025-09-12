import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { Card, CardContent } from "../card";

describe("Card", () => {
  it("renders with children and base styles", () => {
    const { container } = render(
      <Card>
        <CardContent>Content</CardContent>
      </Card>
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute("data-token", "--color-bg");
    expect(card).toHaveClass("bg-card");
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("merges className", () => {
    const { container } = render(<Card className="extra" />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("bg-card", "extra");
  });

  it("forwards ref", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardContent", () => {
  it("merges className and forwards ref", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardContent ref={ref} className="inner" />);
    const content = ref.current as HTMLElement;
    expect(content).toHaveClass("p-6", "inner");
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
