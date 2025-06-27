const { describe, it, expect } = require("@jest/globals");
const React = require("react");
const { render, waitFor, screen } = require("@testing-library/react");
const { usePublishLocations } = require("../usePublishLocations.ts");

describe("usePublishLocations", () => {
  it("returns hard-coded locations after mount", async () => {
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
      expect(Number(screen.getByTestId("count").textContent)).toBe(3);
    });
  });
});
