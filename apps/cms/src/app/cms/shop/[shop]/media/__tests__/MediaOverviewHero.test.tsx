import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MediaOverviewHero from "../components/MediaOverviewHero";

describe("MediaOverviewHero", () => {
  it("renders stats and recent uploads", async () => {
    const handleUpload = jest.fn();
    render(
      <MediaOverviewHero
        shop="demo"
        totalBytes={5 * 1024 * 1024}
        fileCount={12}
        recentUploads={[
          {
            url: "/uploads/demo/hero.jpg",
            title: "Hero shot",
            altText: "Hero alt",
            type: "image",
            bytes: 512 * 1024,
            uploadedAt: "2024-02-02T12:00:00.000Z",
          },
          {
            url: "/uploads/demo/teaser.mp4",
            title: "Launch teaser",
            type: "video",
            bytes: 1024 * 1024,
            uploadedAt: "2024-02-01T10:30:00.000Z",
          },
        ]}
        limits={{ storageBytes: 20 * 1024 * 1024, assets: 100 }}
        onUploadClick={handleUpload}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Media – demo" })
    ).toBeInTheDocument();
    expect(screen.getByText("5.0 MB")).toBeInTheDocument();
    expect(
      screen.getByText(/25% of 20 MB available/i)
    ).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(
      screen.getByText(/12% of 100 assets allowed/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Hero shot")).toBeInTheDocument();
    expect(screen.getByText("Launch teaser")).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes("Feb 2, 2024") && content.includes("512 KB")
      )
    ).toBeInTheDocument();

    const uploadButton = screen.getByRole("button", { name: /upload media/i });
    expect(uploadButton).not.toBeDisabled();
    await userEvent.click(uploadButton);
    expect(handleUpload).toHaveBeenCalled();
  });
});
