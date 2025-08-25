import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SocialFeed from "../SocialFeed";

describe("SocialFeed", () => {
  it("shows fallback when iframe fails", async () => {
    render(<SocialFeed platform="twitter" account="acme" />);
    const iframe = screen.getByTitle("social-feed");
    fireEvent.error(iframe);
    await waitFor(() =>
      expect(
        screen.getByText(/unable to load social feed/i)
      ).toBeInTheDocument()
    );
  });
});

