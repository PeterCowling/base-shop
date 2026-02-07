import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { MediaItem } from "@acme/types";

import MediaOverviewHero from "../components/MediaOverviewHero";

describe("MediaOverviewHero", () => {
  beforeEach(() => {
    jest.spyOn(Intl, "DateTimeFormat").mockImplementation(
      () =>
        ({
          format: (date: Date | number) => {
            const parsed =
              typeof date === "number" ? new Date(date) : date;
            return parsed.toISOString();
          },
        }) as unknown as Intl.DateTimeFormat
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders formatted storage summary, usage progress, and locale-formatted asset counts", () => {
    const assetCount = 12345;
    const recentUploads: MediaItem[] = [
      {
        url: "/uploads/demo-shop/hero-one.jpg",
        title: "Campaign hero",
        type: "image",
        uploadedAt: "2024-03-01T14:15:00.000Z",
      },
    ];

    render(
      <MediaOverviewHero
        shop="demo-shop"
        totalBytes={10 * 1024 * 1024}
        storageLimitBytes={20 * 1024 * 1024}
        assetCount={assetCount}
        recentUploads={recentUploads}
      />
    );

    expect(
      screen.getByRole("heading", { name: /manage your media library/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Asset library · demo-shop/i)).toBeInTheDocument();
    expect(screen.getByText("10 MB of 20 MB")).toBeInTheDocument();

    const progress = screen.getByRole("progressbar", { name: /storage usage/i });
    expect(progress).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("50% of plan capacity")).toBeInTheDocument();

    expect(
      screen.getByText(assetCount.toLocaleString())
    ).toBeInTheDocument();
    const lastUploadCard = screen
      .getByText(/Last upload/i)
      .closest("div");
    expect(lastUploadCard).not.toBeNull();
    expect(
      within(lastUploadCard as HTMLElement).getByText(
        new Date(recentUploads[0].uploadedAt!).toISOString()
      )
    ).toBeInTheDocument();
  });

  it("renders recent uploads in supplied order and falls back to file names", () => {
    const recentUploads: MediaItem[] = [
      {
        url: "/uploads/demo-shop/new-campaign.jpg",
        title: "New campaign hero",
        type: "image",
        uploadedAt: "2024-03-02T09:00:00.000Z",
      },
      {
        url: "/uploads/demo-shop/final%20graphic%20v2.png",
        type: "image",
        uploadedAt: "2024-03-01T17:30:00.000Z",
      },
    ];

    render(
      <MediaOverviewHero
        shop="demo-shop"
        totalBytes={5 * 1024}
        assetCount={2}
        recentUploads={recentUploads}
      />
    );

    const recentList = screen.getByRole("list", { name: /recent media uploads/i });
    const listItems = within(recentList).getAllByRole("listitem");

    expect(listItems).toHaveLength(recentUploads.length);
    expect(
      within(listItems[0]).getByText("New campaign hero")
    ).toBeInTheDocument();
    expect(
      within(listItems[0]).getByText(
        new Date(recentUploads[0].uploadedAt!).toISOString()
      )
    ).toBeInTheDocument();

    expect(
      within(listItems[1]).getByText("final graphic v2.png")
    ).toBeInTheDocument();
    expect(
      within(listItems[1]).getByText(
        new Date(recentUploads[1].uploadedAt!).toISOString()
      )
    ).toBeInTheDocument();
  });

  it("shows empty state message when no recent uploads exist", () => {
    render(
      <MediaOverviewHero
        shop="demo-shop"
        totalBytes={0}
        assetCount={0}
        recentUploads={[]}
      />
    );

    expect(
      screen.getByText(
        "Upload images or videos to populate your media activity feed."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /recent media uploads/i })).not.toBeInTheDocument();
  });

  it("scrolls and focuses the uploader target when the CTA is clicked", async () => {
    const user = userEvent.setup();
    const mockElement = document.createElement("div");
    const scrollIntoView = jest.fn();
    mockElement.scrollIntoView = scrollIntoView as any;
    const focusSpy = jest
      .spyOn(mockElement, "focus")
      .mockImplementation(() => {});

    const getElementByIdSpy = jest
      .spyOn(document, "getElementById")
      .mockReturnValue(mockElement);

    const recentUploads: MediaItem[] = [
      {
        url: "/uploads/demo-shop/hero-one.jpg",
        title: "Campaign hero",
        type: "image",
        uploadedAt: "2024-03-01T14:15:00.000Z",
      },
    ];

    render(
      <MediaOverviewHero
        shop="demo-shop"
        totalBytes={0}
        assetCount={0}
        recentUploads={recentUploads}
        uploaderTargetId="uploader-target"
      />
    );

    await user.click(screen.getByRole("button", { name: /upload media/i }));

    expect(getElementByIdSpy).toHaveBeenCalledWith("uploader-target");
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });
});
