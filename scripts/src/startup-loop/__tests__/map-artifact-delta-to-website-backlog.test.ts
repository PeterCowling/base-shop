import { describe, expect, it } from "@jest/globals";

import { mapArtifactDeltaToWebsiteBacklog } from "../map-artifact-delta-to-website-backlog.js";

describe("mapArtifactDeltaToWebsiteBacklog", () => {
  it("TC-06-01: offer-only change emits home/PLP/PDP copy tasks", () => {
    const result = mapArtifactDeltaToWebsiteBacklog({
      business: "TEST",
      changedPaths: ["docs/business-os/startup-baselines/TEST-offer.md"],
      logisticsApplies: false,
    });

    expect(result.noop).toBe(false);
    expect(result.seeds.map((seed) => seed.route)).toEqual(
      expect.arrayContaining([
        "/[lang]/page",
        "/[lang]/shop/page",
        "/[lang]/product/[slug]/page",
      ]),
    );
  });

  it("TC-06-02: logistics change emits shipping and returns tasks when logistics applies", () => {
    const result = mapArtifactDeltaToWebsiteBacklog({
      business: "TEST",
      changedPaths: ["docs/business-os/strategy/TEST/logistics-pack.user.md"],
      logisticsApplies: true,
    });

    expect(result.noop).toBe(false);
    expect(result.seeds.map((seed) => seed.route)).toEqual(
      expect.arrayContaining(["/[lang]/shipping/page", "/[lang]/returns/page"]),
    );
  });

  it("TC-06-03: unchanged artifacts emit no-op output", () => {
    const result = mapArtifactDeltaToWebsiteBacklog({
      business: "TEST",
      changedPaths: ["docs/business-os/startup-baselines/TEST-intake-packet.user.md"],
      logisticsApplies: false,
    });

    expect(result.noop).toBe(true);
    expect(result.seeds).toHaveLength(0);
  });
});
