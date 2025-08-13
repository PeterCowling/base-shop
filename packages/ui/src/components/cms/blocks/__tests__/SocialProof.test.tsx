// packages/ui/src/components/cms/blocks/__tests__/SocialProof.test.tsx
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
        screen.getByText(/Alice bought Shoes 5 min ago/i)
      ).toBeInTheDocument()
    );

    (global as any).fetch = originalFetch;
  });
});

