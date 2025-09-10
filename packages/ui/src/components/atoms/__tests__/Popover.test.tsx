import "../../../../../../test/resetNextMocks";
import { render, screen, configure } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover";

configure({ testIdAttribute: "data-testid" });

describe("Popover", () => {
  it("opens content when trigger is clicked", async () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent data-testid="content" className="p-2">
          Hello
        </PopoverContent>
      </Popover>,
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Open"));
    const content = screen.getByTestId("content");
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass("p-2");
  });
});
