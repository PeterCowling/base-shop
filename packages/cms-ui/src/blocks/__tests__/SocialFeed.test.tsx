import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import SocialFeed from "../SocialFeed";

describe("SocialFeed", () => {
  it.each([
    ["twitter", "acme", "https://twitframe.com/show?url=https://twitter.com/acme"],
    ["instagram", "acme", "https://www.instagram.com/acme/embed"],
  ])("renders %s embed", (platform, account, expectedSrc) => {
    render(
      <SocialFeed
        platform={platform as "twitter" | "instagram"}
        account={account}
      />
    );
    expect(screen.getByTitle(/social feed/i)).toHaveAttribute("src", expectedSrc);
  });

  it("shows fallback when iframe fails", async () => {
    render(<SocialFeed platform="twitter" account="acme" />);
    const iframe = screen.getByTitle(/social feed/i);
    fireEvent.error(iframe);
    await waitFor(() =>
      expect(
        screen.getByText(/unable to load social feed/i)
      ).toBeInTheDocument()
    );
  });

  it("renders nothing when feed array is empty", () => {
    render(<SocialFeed platform="twitter" />);
    expect(
      screen.getByText(/no social feed configured\./i),
    ).toBeInTheDocument();
  });
});

