import "../../../../../../../test/resetNextMocks";
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
});
