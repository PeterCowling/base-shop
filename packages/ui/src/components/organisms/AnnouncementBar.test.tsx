import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnnouncementBar from "./AnnouncementBar";
import "../../../../../test/resetNextMocks";

describe("AnnouncementBar", () => {
  it("displays the announcement text", () => {
    render(<AnnouncementBar text="Sale" />);
    expect(screen.getByText("Sale")).toBeInTheDocument();
  });

  it("dismisses the bar when close button is clicked", async () => {
    render(<AnnouncementBar text="Deal" closable />);
    await userEvent.click(
      screen.getByRole("button", { name: "Close announcement" })
    );
    expect(screen.queryByText("Deal")).not.toBeInTheDocument();
  });

  it("navigates when link is clicked", async () => {
    const originalUrl = window.location.href;
    render(<AnnouncementBar text="Promo" href="/sale" />);
    const link = screen.getByRole("link", { name: "Promo" });
    await userEvent.click(link);
    expect(window.location.href).toContain("/sale");
    window.history.pushState({}, "", originalUrl);
  });
});

