import { fireEvent, render, screen } from "@testing-library/react";
import SocialFeed from "../SocialFeed";

describe("SocialFeed", () => {
  it("shows fallback when iframe fails", () => {
    render(<SocialFeed platform="twitter" account="acme" />);
    const iframe = screen.getByTitle("social-feed");
    fireEvent.error(iframe);
    expect(
      screen.getByText(/unable to load social feed/i)
    ).toBeInTheDocument();
  });
});

