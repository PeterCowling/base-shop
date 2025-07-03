const { describe, it, expect } = require("@jest/globals");
const React = require("react");
const { render, waitFor, screen } = require("@testing-library/react");
const { usePublishLocations } = require("../usePublishLocations.ts");

describe("usePublishLocations", () => {
  it("fetches locations from API", async () => {
    const original = global.fetch;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: "a", name: "A", path: "a", requiredOrientation: "landscape" },
          ]),
      })
    );
    function Test() {
      const { locations } = usePublishLocations();
      return React.createElement(
        "span",
        { "data-testid": "count" },
        locations.length
      );
    }

    render(React.createElement(Test));

    await waitFor(() => {
      expect(Number(screen.getByTestId("count").textContent)).toBe(1);
    });
    global.fetch = original;
  });
});
