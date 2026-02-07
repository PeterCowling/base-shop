import "../../../../../../../test/resetNextMocks";

import * as React from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { Card, CardContent } from "../card";

describe("Card", () => {
  it("forwards ref, applies data-token, and merges className", async () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <Card ref={ref} className="extra">
        Content
      </Card>
    );

    const card = container.firstChild as HTMLDivElement;
    expect(ref.current).toBe(card);
    expect(card).toHaveAttribute("data-token", "--color-bg");
    expect(card).toHaveClass("bg-card", "extra");
    expect(screen.getByText("Content")).toBeInTheDocument();

  });

  it("passes arbitrary HTML attributes", () => {
    const { container } = render(<Card id="card-id" data-foo="bar" />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute("id", "card-id");

    expect(card).toHaveAttribute("data-foo", "bar");
  });
});

describe("CardContent", () => {
  it("applies default padding and forwards ref", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <CardContent ref={ref} className="inner" />
    );
    const content = container.firstChild as HTMLDivElement;
    expect(ref.current).toBe(content);

    expect(content).toHaveClass("p-6", "inner");
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
