import { projectDecisionBrief } from "./decision-brief";

describe("projectDecisionBrief", () => {
  describe("TC-01: queue-backed dispatch projects into a complete decision brief", () => {
    it("projects all fields from a P1 dispatch with evidence", () => {
      const brief = projectDecisionBrief({
        areaAnchor:
          "Caryina — Customers cannot add anything to cart despite stock being available",
        why: "Every product on the Caryina website has a greyed-out Add to Cart button even though stock exists in the warehouse. No customer can buy anything.",
        title: "Caryina — Customers cannot add anything to cart",
        priority: "P1",
        confidence: 0.95,
        recommendedRoute: "lp-do-build",
        evidenceRefs: [
          "operator-stated: stock values from inventory.json not reaching SKU object, add-to-cart permanently disabled",
          "coverage-hint: UX",
          "coverage-hint: data-contracts",
        ],
        locationAnchors: [
          "apps/caryina/src/lib/shop.ts",
          "data/shops/caryina/inventory.json",
        ],
      });

      expect(brief.problem).toBe(
        "Caryina — Customers cannot add anything to cart despite stock being available"
      );
      expect(brief.whyNow).toContain("No customer can buy anything");
      expect(brief.benefitCategory).toBe("conversion_reliability");
      expect(brief.businessBenefit).toContain("unblocks purchases");
      expect(brief.expectedNextStep).toBe(
        "Work starts immediately once you approve."
      );
      expect(brief.confidenceExplainer).toContain("High confidence");
      expect(brief.evidenceLabels.length).toBeGreaterThan(0);
    });
  });

  describe("TC-03: business benefit from controlled taxonomy", () => {
    it("classifies security-related items as risk_reduction", () => {
      const brief = projectDecisionBrief({
        title: "Fix auth bypass",
        evidenceRefs: ["coverage-hint: security"],
      });
      expect(brief.benefitCategory).toBe("risk_reduction");
      expect(brief.businessBenefit).toContain("reduces the risk");
    });

    it("classifies cart/checkout items as conversion_reliability", () => {
      const brief = projectDecisionBrief({
        title: "Cart is broken for all users",
        why: "Customers cannot complete checkout due to a broken cart.",
      });
      expect(brief.benefitCategory).toBe("conversion_reliability");
    });

    it("classifies ambiguity/clarity items as clarity", () => {
      const brief = projectDecisionBrief({
        title: "Confusing error message",
        why: "The error message is unclear and confuses users about what went wrong.",
        priority: "P2",
      });
      expect(brief.benefitCategory).toBe("clarity");
    });

    it("falls back to unknown when no signals match", () => {
      const brief = projectDecisionBrief({ title: "Miscellaneous update" });
      expect(brief.benefitCategory).toBe("unknown");
      expect(brief.businessBenefit).toContain("moves the idea forward");
    });
  });

  describe("TC-04: expected-next-step from explicit route mapping", () => {
    it("maps lp-do-build", () => {
      const brief = projectDecisionBrief({
        title: "x",
        recommendedRoute: "lp-do-build",
      });
      expect(brief.expectedNextStep).toBe(
        "Work starts immediately once you approve."
      );
    });

    it("maps lp-do-fact-find", () => {
      const brief = projectDecisionBrief({
        title: "x",
        recommendedRoute: "lp-do-fact-find",
      });
      expect(brief.expectedNextStep).toContain("investigation");
    });

    it("falls back for unknown route", () => {
      const brief = projectDecisionBrief({
        title: "x",
        recommendedRoute: "unknown-route",
      });
      expect(brief.expectedNextStep).toContain("routing flow");
    });

    it("falls back when route is absent", () => {
      const brief = projectDecisionBrief({ title: "x" });
      expect(brief.expectedNextStep).toContain("routing flow");
    });
  });

  describe("TC-05: confidence narrative safe fallbacks", () => {
    it("omits confidenceExplainer when confidence is absent", () => {
      const brief = projectDecisionBrief({ title: "x" });
      expect(brief.confidenceExplainer).toBeUndefined();
    });

    it("includes explainer for high confidence", () => {
      const brief = projectDecisionBrief({ title: "x", confidence: 0.9 });
      expect(brief.confidenceExplainer).toContain("Very high confidence");
    });

    it("includes explainer for low confidence", () => {
      const brief = projectDecisionBrief({ title: "x", confidence: 0.4 });
      expect(brief.confidenceExplainer).toContain("Lower confidence");
    });
  });

  describe("evidence labels", () => {
    it("labels operator-stated refs correctly", () => {
      const brief = projectDecisionBrief({
        title: "x",
        evidenceRefs: ["operator-stated: something is wrong"],
      });
      const operatorLabel = brief.evidenceLabels.find(
        (l) => l.label === "Operator observation"
      );
      expect(operatorLabel).toBeDefined();
    });

    it("labels coverage-hint refs correctly", () => {
      const brief = projectDecisionBrief({
        title: "x",
        evidenceRefs: ["coverage-hint: testing"],
      });
      const coverageLabel = brief.evidenceLabels.find((l) =>
        l.label.startsWith("Coverage:")
      );
      expect(coverageLabel).toBeDefined();
    });

    it("labels location anchors as File entries", () => {
      const brief = projectDecisionBrief({
        title: "x",
        locationAnchors: ["apps/foo/bar.ts"],
      });
      const fileLabel = brief.evidenceLabels.find(
        (l) => l.label === "File" && l.raw === "apps/foo/bar.ts"
      );
      expect(fileLabel).toBeDefined();
    });
  });
});
