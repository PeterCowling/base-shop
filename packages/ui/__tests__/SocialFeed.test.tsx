import { render, screen, waitFor } from "@testing-library/react";
import SocialFeed from "../src/components/cms/blocks/SocialFeed";

describe("SocialFeed", () => {
  const originalCreate = document.createElement.bind(document);

  afterEach(() => {
    document.createElement = originalCreate;
  });

  it("shows fallback on script failure", async () => {
    document.createElement = ((tagName: string) => {
      const el = originalCreate(tagName);
      if (tagName === "script") {
        setTimeout(() => {
          el.onerror?.(new Event("error"));
        }, 0);
      }
      return el;
    }) as any;

    render(<SocialFeed provider="twitter" account="test" />);

    await waitFor(() =>
      expect(
        screen.getByText(/Unable to load social feed/i)
      ).toBeInTheDocument()
    );
  });
});

