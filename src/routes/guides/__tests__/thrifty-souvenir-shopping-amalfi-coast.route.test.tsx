import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/thrifty-souvenir-shopping-amalfi-coast";
const ROUTE = "/en/guides/thrifty-souvenir-shopping-amalfi-coast";

describe("thrifty-souvenir-shopping-amalfi-coast route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("enables manual fallback rendering and exposes a ToC builder", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<{
      guideKey: string;
      metaKey: string;
      preferManualWhenUnlocalized?: boolean;
      buildTocItems?: unknown;
    }>();

    expect(props?.guideKey).toBe("souvenirsAmalfi");
    expect(props?.metaKey).toBe("souvenirsAmalfi");
    expect(props?.preferManualWhenUnlocalized).toBe(true);
    expect(typeof props?.buildTocItems).toBe("function");
  });
});