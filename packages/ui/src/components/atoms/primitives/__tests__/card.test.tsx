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

  it("passes arbitrary HTML attributes", () => {
    const { container } = render(
      <Card id="card-id" data-foo="bar" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute("id", "card-id");
    expect(card).toHaveAttribute("data-foo", "bar");
  });

  it("forwards ref", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardContent", () => {
  it("merges className", () => {
    const { container } = render(<CardContent className="inner" />);
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass("p-6", "inner");
  });

  it("forwards ref", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardContent ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("passes arbitrary HTML attributes", () => {
    const { container } = render(
      <CardContent id="content-id" data-foo="baz" />
    );
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveAttribute("id", "content-id");
    expect(content).toHaveAttribute("data-foo", "baz");
  });
});
