import "../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnnouncementBar from "../src/components/organisms/AnnouncementBar";

describe("AnnouncementBar", () => {
  it("returns null when no text", () => {
    const { container } = render(<AnnouncementBar />);
    expect(container.firstChild).toBeNull();
  });

  it("hides bar after close click", async () => {
    render(<AnnouncementBar text="Hello" closable />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Close announcement" })
    );
    expect(screen.queryByText("Hello")).not.toBeInTheDocument();
  });

  it("renders link when href provided and none when absent", () => {
    const { rerender } = render(
      <AnnouncementBar text="Promo" href="/sale" />
    );
    const link = screen.getByRole("link", { name: "Promo" });
    expect(link).toHaveAttribute("href", "/sale");

    rerender(<AnnouncementBar text="Promo" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Promo")).toBeInTheDocument();
  });
});
