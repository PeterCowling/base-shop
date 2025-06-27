const { describe, it, expect } = require("@jest/globals");
const React = require("react");
const { render, waitFor, screen } = require("@testing-library/react");
const {
  useImageOrientationValidation,
} = require("../useImageOrientationValidation.ts");

class MockImage {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.width = 0;
    this.height = 0;
  }
  set src(_val) {
    this.width = 800; // landscape
    this.height = 400;
    if (this.onload) setTimeout(() => this.onload());
  }
}

describe("useImageOrientationValidation", () => {
  it("reports landscape orientation when required", async () => {
    global.Image = MockImage;
    global.URL.createObjectURL = jest.fn(() => "blob:mock");
    global.URL.revokeObjectURL = jest.fn();

    const file = new File(["x"], "x.png", { type: "image/png" });

    function Test() {
      const result = useImageOrientationValidation(file, "landscape");
      return React.createElement(
        React.Fragment,
        null,
        React.createElement("span", { "data-testid": "actual" }, result.actual),
        React.createElement(
          "span",
          { "data-testid": "valid" },
          String(result.isValid)
        )
      );
    }

    render(React.createElement(Test));

    await waitFor(() => {
      expect(screen.getByTestId("actual").textContent).toBe("landscape");
    });
    expect(screen.getByTestId("valid").textContent).toBe("true");
  });
});
