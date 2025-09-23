import "../../../../../../test/resetNextMocks";
import { render, screen, configure } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover";

describe("Popover (container)", () => {
  configure({ testIdAttribute: "data-testid" });
  it("renders content inside provided container via Portal", async () => {
    const portal = document.createElement("div");
    portal.setAttribute("data-testid", "portal");
    document.body.appendChild(portal);

    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent data-testid="content" container={portal}>
          Hello
        </PopoverContent>
      </Popover>,
    );

    await userEvent.click(screen.getByText("Open"));
    const content = screen.getByTestId("content");
    const portalNode = screen.getByTestId("portal");
    expect(portalNode.contains(content)).toBe(true);
  });
});
