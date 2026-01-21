import type { ConfiguratorProgress } from "@acme/types";

import { buildLaunchChecklist } from "../launchChecklist";
import type { LaunchChecklistItem } from "../types";

const t = (key: string) => key;

describe("buildLaunchChecklist", () => {
  it("links checkout to the builder with exitReason pages", () => {
    const progress = {
      shopId: "demo",
      steps: {
        checkout: "error",
      },
      completedRequired: 0,
      totalRequired: 0,
      completedOptional: 0,
      totalOptional: 0,
      lastUpdated: new Date().toISOString(),
    } as unknown as ConfiguratorProgress;

    const list = buildLaunchChecklist({ progress, translate: t });
    const checkout = list.find((item: LaunchChecklistItem) => item.id === "checkout");
    expect(checkout?.targetHref).toBe("/cms/shop/demo/pages/checkout/builder");
    expect(checkout?.exitReason).toBe("pages");
    expect(checkout?.status).toBe("error");
  });
});
