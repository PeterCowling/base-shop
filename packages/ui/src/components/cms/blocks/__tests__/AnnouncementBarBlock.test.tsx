import { render, screen } from "@testing-library/react";
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
});
