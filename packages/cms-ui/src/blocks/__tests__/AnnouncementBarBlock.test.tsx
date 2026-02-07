import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AnnouncementBarBlock from "../AnnouncementBarBlock";

describe("AnnouncementBarBlock", () => {
  it("renders provided text", () => {
    render(<AnnouncementBarBlock text="Sale" />);
    expect(screen.getByText("Sale")).toBeInTheDocument();
  });

  it("returns null when no text", () => {
    const { container } = render(<AnnouncementBarBlock />);
    expect(container.firstChild).toBeNull();
  });

  it("renders link with correct href", () => {
    render(<AnnouncementBarBlock text="Promo" link="/sale" />);
    const link = screen.getByRole("link", { name: "Promo" });
    expect(link).toHaveAttribute("href", "/sale");
  });

  it("hides bar after close click", async () => {
    render(<AnnouncementBarBlock text="Hello" closable />);
    expect(
      screen.getByRole("button", { name: "Close announcement" })
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Close announcement" })
    );
    expect(screen.queryByText("Hello")).not.toBeInTheDocument();
  });
});
