import { renderToStaticMarkup } from "react-dom/server";

jest.mock("../src/lib/seo", () => ({
  getStructuredData: () => ({ foo: "bar" }),
  serializeJsonLd: () => "json",
}));

describe("home page client component", () => {
  it("renders structured data", () => {
    const Home = require("../src/app/[lang]/page.client.tsx").default;
    const html = renderToStaticMarkup(<Home params={{ lang: "en" }} />);
    expect(html).toContain("application/ld+json");
    expect(html).toContain("json");
  });
});
