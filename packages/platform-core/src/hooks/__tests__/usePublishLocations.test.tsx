// packages/platform-core/hooks/__tests__/usePublishLocations.test.tsx
import { loadPublishLocations } from "../usePublishLocations";

describe("usePublishLocations", () => {
  it("fetches locations from API", async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify([
              {
                id: "a",
                name: "A",
                path: "a",
                requiredOrientation: "landscape",
              },
            ]),
          ),
        json: () =>
          Promise.resolve([
            {
              id: "a",
              name: "A",
              path: "a",
              requiredOrientation: "landscape",
            },
          ]),
      }),
    ) as unknown as typeof fetch;

    const locations = await loadPublishLocations();
    expect(locations).toHaveLength(1);

    global.fetch = originalFetch;
  });
});

