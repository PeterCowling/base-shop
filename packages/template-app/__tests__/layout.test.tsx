import { renderToStaticMarkup } from "react-dom/server";

jest.mock("../src/app/AnalyticsScripts", () => ({
  __esModule: true,
  default: () => <div data-testid="analytics" />,
}));

describe("RootLayout", () => {
  const { default: RootLayout, metadata } = require("../src/app/layout");

  it("exports metadata", () => {
    expect(metadata.title).toBe("Base-Shop");
  });

  it("renders providers and children", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <span>child</span>
      </RootLayout>
    );
    expect(html).toContain("data-testid=\"analytics\"");
    expect(html).toContain("child");
    expect(html).toContain("<html lang=\"en\"");
  });
});
