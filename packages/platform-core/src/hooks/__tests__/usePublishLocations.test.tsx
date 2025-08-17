// packages/platform-core/hooks/__tests__/usePublishLocations.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { usePublishLocations } from "@platform-core/hooks/usePublishLocations";

describe("usePublishLocations", () => {
  it("fetches locations from API", async () => {
    /* --------------- mock fetch ----------------- */
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: "a",
              name: "A",
              path: "a",
              requiredOrientation: "landscape",
            },
          ]),
      })
    ) as unknown as typeof fetch;

    /* --------------- test component ------------- */
    function Test() {
      const { locations } = usePublishLocations();
      return <span data-testid="count">{locations.length}</span>;
    }

    render(<Test />);

    await waitFor(() =>
      expect(Number(screen.getByTestId("count").textContent)).toBe(1)
    );

    /* --------------- restore fetch -------------- */
    global.fetch = originalFetch;
  });
});
