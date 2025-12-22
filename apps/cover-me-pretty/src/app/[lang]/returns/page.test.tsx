// apps/cover-me-pretty/src/app/[lang]/returns/page.test.tsx
jest.mock("@platform-core/returnLogistics", () => ({
  getReturnLogistics: jest.fn(),
  getReturnBagAndLabel: jest.fn(),
}));
jest.mock("@platform-core/repositories/settings.server", () => ({
  getShopSettings: jest.fn(),
}));

import { renderToStaticMarkup } from "react-dom/server";
import ReturnPolicyPage from "./page";
import {
  getReturnLogistics,
  getReturnBagAndLabel,
} from "@platform-core/returnLogistics";
import { getShopSettings } from "@platform-core/repositories/settings.server";

describe("ReturnPolicyPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("renders optional elements when enabled", async () => {
    (getReturnLogistics as jest.Mock).mockResolvedValue({
      dropOffProvider: "UPS",
      inStore: true,
      tracking: true,
      requireTags: true,
      allowWear: false,
    });
    (getReturnBagAndLabel as jest.Mock).mockResolvedValue({
      bagType: "reusable",
      labelService: "postal",
      returnCarrier: ["UPS"],
      homePickupZipCodes: ["10001"],
    });
    (getShopSettings as jest.Mock).mockResolvedValue({
      returnService: { bagEnabled: true, homePickupEnabled: true },
    });

    const element = await ReturnPolicyPage({ params: { lang: "en" } });
    const html = renderToStaticMarkup(element);

    expect(html).toContain(
      "Please reuse the reusable bag for your return."
    );
    expect(html).toContain("Drop-off: UPS");
    expect(html).toContain("Home pickup available in: 10001");
    expect(html).toContain("returns.trackingEnabled");
    expect(html).toContain("Items must have all tags attached for return.");
    expect(html).toContain("Items showing signs of wear may be rejected.");
  });

  test("omits optional elements when disabled", async () => {
    (getReturnLogistics as jest.Mock).mockResolvedValue({
      inStore: true,
      allowWear: true,
    });
    (getReturnBagAndLabel as jest.Mock).mockResolvedValue({
      bagType: "paper",
      labelService: "ups",
      returnCarrier: ["UPS"],
      homePickupZipCodes: [],
    });
    (getShopSettings as jest.Mock).mockResolvedValue({
      returnService: { bagEnabled: false, homePickupEnabled: false },
    });

    const element = await ReturnPolicyPage({ params: { lang: "en" } });
    const html = renderToStaticMarkup(element);

    expect(html).not.toContain("Please reuse");
    expect(html).not.toContain("Drop-off:");
    expect(html).not.toContain("Home pickup available");
    expect(html).not.toContain("Tracking");
    expect(html).not.toContain("Items must have all tags attached for return.");
    expect(html).not.toContain("Items showing signs of wear may be rejected.");
  });
});
