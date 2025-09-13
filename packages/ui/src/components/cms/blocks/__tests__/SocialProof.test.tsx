import { render, screen, waitFor } from "@testing-library/react";
import SocialProof from "../SocialProof";

describe("SocialProof", () => {
  it("renders order event", async () => {
    const events = [
      {
        customer: "Alice",
        product: "Shoes",
        timestamp: Date.now() - 5 * 60 * 1000,
      },
    ];
    const originalFetch = (global as any).fetch;
    (global as any).fetch = jest.fn().mockResolvedValue({
      json: async () => events,
    });

    render(<SocialProof source="/api" frequency={1000} />);

    await waitFor(() =>
      expect(
        screen.getByText(/Alice bought Shoes 5 min ago/i),
      ).toBeInTheDocument(),
    );

    (global as any).fetch = originalFetch;
  });

  it("renders ratings when provided", () => {
    render(<SocialProof rating={{ rating: 4.5, count: 10 }} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.queryByText(/Great service!/i)).not.toBeInTheDocument();
  });

  it("renders testimonials when provided", () => {
    const testimonials = [{ quote: "Great service!", name: "Bob" }];
    render(<SocialProof testimonials={testimonials} />);
    expect(screen.getByText(/Great service!/i)).toBeInTheDocument();
    expect(screen.queryByText("4.5")).not.toBeInTheDocument();
  });

  it("returns null when no data is supplied", () => {
    const { container } = render(<SocialProof />);
    expect(container.firstChild).toBeNull();
  });
});

