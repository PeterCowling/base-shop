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

  it("shows the matching panel when different tabs are clicked", () => {
    render(
      <TabsBlock labels={["One", "Two", "Three"]}>
        <div>Panel One</div>
        <div>Panel Two</div>
        <div>Panel Three</div>
      </TabsBlock>
    );

    const buttons = screen.getAllByRole("button");

    fireEvent.click(buttons[1]);
    expect(screen.getByText("Panel Two")).toBeInTheDocument();
    expect(screen.queryByText("Panel One")).not.toBeInTheDocument();

    fireEvent.click(buttons[2]);
    expect(screen.getByText("Panel Three")).toBeInTheDocument();
    expect(screen.queryByText("Panel Two")).not.toBeInTheDocument();
  });

  it("supports keyboard navigation with arrow keys", () => {
    render(
      <TabsBlock labels={["One", "Two", "Three"]}>
        <div>Panel One</div>
        <div>Panel Two</div>
        <div>Panel Three</div>
      </TabsBlock>
    );

    const buttons = screen.getAllByRole("button");

    fireEvent.keyDown(buttons[0], { key: "ArrowRight" });
    expect(buttons[1]).toHaveClass("border-primary");
    expect(screen.getByText("Panel Two")).toBeInTheDocument();

    fireEvent.keyDown(buttons[1], { key: "ArrowLeft" });
    expect(buttons[0]).toHaveClass("border-primary");
    expect(screen.getByText("Panel One")).toBeInTheDocument();
  });
});

