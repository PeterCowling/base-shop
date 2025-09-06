import { render, screen, fireEvent } from "@testing-library/react";
import TabsBlock from "../Tabs";

describe("TabsBlock", () => {
  it("respects default active index and handles extra labels", () => {
    render(
      <TabsBlock labels={["One", "Two", "Three"]} active={1}>
        <div>Content One</div>
        <div>Content Two</div>
      </TabsBlock>
    );

    const buttons = screen.getAllByRole("button");

    // second tab should be active on mount
    expect(buttons[1]).toHaveClass("border-primary");
    expect(screen.getByText("Content Two")).toBeInTheDocument();

    // switching to first tab updates active class and content
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveClass("border-primary");
    expect(screen.getByText("Content One")).toBeInTheDocument();

    // clicking a tab without corresponding content clamps to last pane
    fireEvent.click(buttons[2]);
    expect(buttons[1]).toHaveClass("border-primary");
    expect(screen.getByText("Content Two")).toBeInTheDocument();
  });
});

