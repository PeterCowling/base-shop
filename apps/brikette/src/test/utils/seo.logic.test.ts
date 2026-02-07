
import "@testing-library/jest-dom";

import { buildBreadcrumb, buildLinks, buildMeta } from "@/utils/seo";

const origin = "https://hostel-positano.com";

describe("document head logic", () => {
  it("generates complete head content for home page", () => {
    const path = "/en";
    const lang = "en";
    const title = "Hostel Positano";
    const description = "Stay in Positano's only hostel with incredible views.";
    const url = `${origin}${path}`;
    const homeLabel = "Home";

    const meta = buildMeta({ lang, title, description, url });
    const links = buildLinks({ lang, origin, path });
    const breadcrumb = buildBreadcrumb({ lang, origin, path, title: homeLabel, homeLabel });

    expect(meta.length).toBeGreaterThan(5);
    expect(links.length).toBeGreaterThan(3);
    expect(breadcrumb.itemListElement).toHaveLength(1);
    expect(links[0].rel).toBe("canonical");
  });

  it("handles subpages and breadcrumb depth", () => {
    const path = "/en/rooms";
    const lang = "en";
    const title = "Rooms";
    const homeLabel = "Home";

    const breadcrumb = buildBreadcrumb({ lang, origin, path, title, homeLabel });
    expect(breadcrumb.itemListElement).toHaveLength(2);
    expect(breadcrumb.itemListElement[1].name).toBe("Rooms");
  });

  it("respects fallback for unknown languages", () => {
    const path = "/xx/somewhere";
    const links = buildLinks({ lang: "xx", origin, path });

    const canonical = links.find((link) => link.rel === "canonical");
    const normalizedPath = path.endsWith("/") ? path : `${path}/`;
    expect(canonical?.href).toBe(`${origin}${normalizedPath}`);
  });
});
