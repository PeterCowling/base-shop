import { render, screen, within } from "@testing-library/react";
import type { MediaItem } from "@acme/types";
import MediaOverviewHero from "../components/MediaOverviewHero";

describe("MediaOverviewHero", () => {
  it("renders key stats and recent uploads", () => {
    const mockRecent: MediaItem[] = [
      {
        url: "/uploads/demo-shop/hero-one.jpg",
        title: "Campaign hero",
        type: "image",
        uploadedAt: "2024-03-01T14:15:00.000Z",
      },
      {
        url: "/uploads/demo-shop/launch-teaser.mp4",
        altText: "Launch teaser",
        type: "video",
        uploadedAt: "2024-02-28T09:30:00.000Z",
      },
    ];

    render(
      <MediaOverviewHero
        shop="demo-shop"
        totalBytes={10 * 1024 * 1024}
        assetCount={42}
        recentUploads={mockRecent}
      />
    );

    expect(
      screen.getByRole("heading", { name: /manage your media library/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Asset library · demo-shop/i)).toBeInTheDocument();
    expect(screen.getByText("10 MB")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();

    const recentList = screen.getByRole("list", { name: /recent media uploads/i });
    const listItems = within(recentList).getAllByRole("listitem");
    expect(listItems).toHaveLength(mockRecent.length);

    const formattedTimestamp = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(mockRecent[0].uploadedAt!));
    const [firstRecent, videoRecent] = listItems;
    expect(
      within(firstRecent).getByText(formattedTimestamp)
    ).toBeInTheDocument();
    expect(within(firstRecent).getByText("Campaign hero")).toBeInTheDocument();
    expect(within(videoRecent).getByText(/Video/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload media/i })).toBeInTheDocument();
  });
});
