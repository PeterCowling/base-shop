import { describe, expect, it } from "@jest/globals";

import {
  CI_BOS_FILTER,
  CI_FILTER,
  LIGHTHOUSE_FILTER,
  MERGE_GATE_FILTER,
} from "../../src/ci/filter-config";
import { classifyPaths } from "../../src/ci/path-classifier";

describe("classifyPaths", () => {
  describe("ci.yml shop filter", () => {
    it("TC-01: matches cover-me-pretty changes", () => {
      const result = classifyPaths(
        ["apps/cover-me-pretty/src/page.tsx"],
        CI_FILTER,
      );
      expect(result.shop).toBe(true);
    });

    it("TC-02: does not match docs-only changes", () => {
      const result = classifyPaths(["docs/README.md"], CI_FILTER);
      expect(result.shop).toBe(false);
    });
  });

  describe("ci.yml bos_guarded filter", () => {
    it("TC-03: matches BOS card changes", () => {
      const result = classifyPaths(
        ["docs/business-os/cards/PLAT-ENG-0001.md"],
        CI_BOS_FILTER,
      );
      expect(result.bos_guarded).toBe(true);
    });

    it("TC-04: excludes README.md via negation", () => {
      const result = classifyPaths(
        ["docs/business-os/README.md"],
        CI_BOS_FILTER,
      );
      expect(result.bos_guarded).toBe(false);
    });

    it("TC-05: excludes scans directory via negation", () => {
      const result = classifyPaths(
        ["docs/business-os/scans/2026-02-09.md"],
        CI_BOS_FILTER,
      );
      expect(result.bos_guarded).toBe(false);
    });

    it("excludes strategy directory via negation", () => {
      const result = classifyPaths(
        ["docs/business-os/strategy/growth.md"],
        CI_BOS_FILTER,
      );
      expect(result.bos_guarded).toBe(false);
    });

    it("excludes people directory via negation", () => {
      const result = classifyPaths(
        ["docs/business-os/people/team.md"],
        CI_BOS_FILTER,
      );
      expect(result.bos_guarded).toBe(false);
    });
  });

  describe("merge-gate.yml filters", () => {
    it("TC-06: github_config matches workflow changes", () => {
      const result = classifyPaths(
        [".github/workflows/ci.yml"],
        MERGE_GATE_FILTER,
      );
      expect(result.github_config).toBe(true);
    });

    it("github_config matches actions changes", () => {
      const result = classifyPaths(
        [".github/actions/setup-repo/action.yml"],
        MERGE_GATE_FILTER,
      );
      expect(result.github_config).toBe(true);
    });

    it("github_config matches dependabot.yml", () => {
      const result = classifyPaths(
        [".github/dependabot.yml"],
        MERGE_GATE_FILTER,
      );
      expect(result.github_config).toBe(true);
    });

    it("TC-07: core filter matches non-CMS/Skylar paths", () => {
      const result = classifyPaths(
        ["packages/ui/src/Button.tsx"],
        MERGE_GATE_FILTER,
      );
      expect(result.core).toBe(true);
    });

    it("TC-08: core filter excludes CMS-only changes", () => {
      const result = classifyPaths(
        ["apps/cms/src/api/route.ts"],
        MERGE_GATE_FILTER,
      );
      expect(result.core).toBe(false);
    });

    it("TC-09: core filter excludes Skylar-only changes", () => {
      const result = classifyPaths(
        ["apps/skylar/src/page.tsx"],
        MERGE_GATE_FILTER,
      );
      expect(result.core).toBe(false);
    });

    it("core filter excludes cms.yml workflow", () => {
      const result = classifyPaths(
        [".github/workflows/cms.yml"],
        MERGE_GATE_FILTER,
      );
      expect(result.core).toBe(false);
    });

    it("TC-10: CMS change triggers cms_deploy and cms_e2e but not core", () => {
      const result = classifyPaths(
        ["apps/cms/src/api/route.ts"],
        MERGE_GATE_FILTER,
      );
      expect(result.cms_deploy).toBe(true);
      expect(result.cms_e2e).toBe(true);
      expect(result.core).toBe(false);
    });

    it("TC-11: shared package (packages/ui) triggers many filters", () => {
      const result = classifyPaths(
        ["packages/ui/src/Button.tsx"],
        MERGE_GATE_FILTER,
      );
      expect(result.core).toBe(true);
      expect(result.cms_deploy).toBe(true);
      expect(result.cms_e2e).toBe(true);
      expect(result.skylar).toBe(true);
      expect(result.brikette).toBe(true);
      expect(result.prime).toBe(true);
      expect(result.product_pipeline).toBe(true);
      expect(result.storybook).toBe(true);
      expect(result.consent_analytics).toBe(false);
    });

    it("TC-12: consent_analytics matches specific deep paths only", () => {
      const result = classifyPaths(
        ["apps/cover-me-pretty/src/app/api/analytics/route.ts"],
        MERGE_GATE_FILTER,
      );
      expect(result.consent_analytics).toBe(true);
    });

    it("consent_analytics does not match shallow app path", () => {
      const result = classifyPaths(
        ["apps/cover-me-pretty/src/page.tsx"],
        MERGE_GATE_FILTER,
      );
      expect(result.consent_analytics).toBe(false);
    });

    it("TC-13: brikette filter matches design-system changes", () => {
      const result = classifyPaths(
        ["packages/design-system/src/tokens.ts"],
        MERGE_GATE_FILTER,
      );
      expect(result.brikette).toBe(true);
    });
  });

  describe("ci-lighthouse.yml filter", () => {
    it("TC-14: shop_skylar matches both CMP and Skylar apps", () => {
      const result = classifyPaths(
        ["apps/cover-me-pretty/src/page.tsx", "apps/skylar/src/page.tsx"],
        LIGHTHOUSE_FILTER,
      );
      expect(result.shop_skylar).toBe(true);
    });

    it("TC-15: shop_skylar matches lighthouse config files", () => {
      const result = classifyPaths(
        [".lighthouseci/config.json"],
        LIGHTHOUSE_FILTER,
      );
      expect(result.shop_skylar).toBe(true);
    });

    it("shop_skylar matches lighthouserc glob pattern", () => {
      const result = classifyPaths(
        ["lighthouserc-cmp.json"],
        LIGHTHOUSE_FILTER,
      );
      expect(result.shop_skylar).toBe(true);
    });
  });

  describe("CI-SC-04 parity fixture matrix", () => {
    it("F1: cover-me-pretty page change", () => {
      const ci = classifyPaths(
        ["apps/cover-me-pretty/src/page.tsx"],
        CI_FILTER,
      );
      const mg = classifyPaths(
        ["apps/cover-me-pretty/src/page.tsx"],
        MERGE_GATE_FILTER,
      );
      const lh = classifyPaths(
        ["apps/cover-me-pretty/src/page.tsx"],
        LIGHTHOUSE_FILTER,
      );
      expect(ci.shop).toBe(true);
      expect(mg.core).toBe(true);
      expect(mg.storybook).toBe(true);
      expect(mg.lhci).toBe(true);
      expect(lh.shop_skylar).toBe(true);
      expect(mg.consent_analytics).toBe(false);
    });

    it("F2: CMS-only change", () => {
      const ci = classifyPaths(["apps/cms/src/api/route.ts"], CI_FILTER);
      const mg = classifyPaths(
        ["apps/cms/src/api/route.ts"],
        MERGE_GATE_FILTER,
      );
      expect(ci.shop).toBe(true);
      expect(mg.core).toBe(false);
      expect(mg.cms_deploy).toBe(true);
      expect(mg.cms_e2e).toBe(true);
      expect(mg.storybook).toBe(true);
    });

    it("F3: docs-only change", () => {
      const ci = classifyPaths(["docs/README.md"], CI_FILTER);
      const mg = classifyPaths(["docs/README.md"], MERGE_GATE_FILTER);
      expect(ci.shop).toBe(false);
      expect(mg.core).toBe(true);
      expect(mg.cms_deploy).toBe(false);
      expect(mg.skylar).toBe(false);
      expect(mg.brikette).toBe(false);
    });

    it("F4: workflow file change", () => {
      const mg = classifyPaths(
        [".github/workflows/ci.yml"],
        MERGE_GATE_FILTER,
      );
      expect(mg.github_config).toBe(true);
      expect(mg.core).toBe(true);
    });

    it("F5: shared package (packages/ui) change", () => {
      const mg = classifyPaths(
        ["packages/ui/src/Button.tsx"],
        MERGE_GATE_FILTER,
      );
      expect(mg.core).toBe(true);
      expect(mg.cms_deploy).toBe(true);
      expect(mg.cms_e2e).toBe(true);
      expect(mg.skylar).toBe(true);
      expect(mg.brikette).toBe(true);
      expect(mg.prime).toBe(true);
      expect(mg.product_pipeline).toBe(true);
      expect(mg.storybook).toBe(true);
    });

    it("F6: brikette-only change", () => {
      const mg = classifyPaths(
        ["apps/brikette/src/page.tsx"],
        MERGE_GATE_FILTER,
      );
      expect(mg.core).toBe(true);
      expect(mg.brikette).toBe(true);
      expect(mg.cms_deploy).toBe(false);
      expect(mg.skylar).toBe(false);
    });

    it("F7: BOS card change (guarded)", () => {
      const bos = classifyPaths(
        ["docs/business-os/cards/PLAT-ENG-0001.md"],
        CI_BOS_FILTER,
      );
      const mg = classifyPaths(
        ["docs/business-os/cards/PLAT-ENG-0001.md"],
        MERGE_GATE_FILTER,
      );
      expect(bos.bos_guarded).toBe(true);
      expect(mg.core).toBe(true);
    });

    it("F8: BOS README change (excluded from guard)", () => {
      const bos = classifyPaths(
        ["docs/business-os/README.md"],
        CI_BOS_FILTER,
      );
      const mg = classifyPaths(
        ["docs/business-os/README.md"],
        MERGE_GATE_FILTER,
      );
      expect(bos.bos_guarded).toBe(false);
      expect(mg.core).toBe(true);
    });

    it("F9: skylar-only change", () => {
      const mg = classifyPaths(
        ["apps/skylar/src/page.tsx"],
        MERGE_GATE_FILTER,
      );
      const lh = classifyPaths(
        ["apps/skylar/src/page.tsx"],
        LIGHTHOUSE_FILTER,
      );
      expect(mg.core).toBe(false);
      expect(mg.skylar).toBe(true);
      expect(mg.lhci).toBe(true);
      expect(lh.shop_skylar).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("empty file list returns all filters as false", () => {
      const result = classifyPaths([], MERGE_GATE_FILTER);
      expect(Object.values(result).every((v) => v === false)).toBe(true);
    });

    it("handles paths with leading ./", () => {
      const result = classifyPaths(
        ["./apps/cms/src/route.ts"],
        MERGE_GATE_FILTER,
      );
      expect(result.cms_deploy).toBe(true);
    });

    it("handles Windows-style backslashes", () => {
      const result = classifyPaths(
        ["apps\\cms\\src\\route.ts"],
        MERGE_GATE_FILTER,
      );
      expect(result.cms_deploy).toBe(true);
    });

    it("handles whitespace-padded paths", () => {
      const result = classifyPaths(
        ["  apps/cms/src/route.ts  "],
        MERGE_GATE_FILTER,
      );
      expect(result.cms_deploy).toBe(true);
    });

    it("skips empty strings in file list", () => {
      const result = classifyPaths(["", "  ", "apps/cms/src/route.ts"], CI_FILTER);
      expect(result.shop).toBe(true);
    });

    it("rename: evaluates both old and new paths", () => {
      // If renamed from CMS to non-CMS location, both trigger their respective filters
      const result = classifyPaths(
        ["apps/cms/src/old.ts", "packages/ui/src/new.ts"],
        MERGE_GATE_FILTER,
      );
      expect(result.cms_deploy).toBe(true);
      expect(result.core).toBe(true);
    });
  });
});
