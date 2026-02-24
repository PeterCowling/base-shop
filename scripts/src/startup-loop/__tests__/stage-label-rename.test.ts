/**
 * Stage label + alias stability tests.
 *
 * Guardrail: canonical labels and aliases are generated from
 * docs/business-os/startup-loop/_generated/stage-operator-map.json.
 */

import stageOperatorMap from "../../../../docs/business-os/startup-loop/_generated/stage-operator-map.json";
import { resolveByAlias, resolveByLabel } from "../stage-addressing.js";

describe("Label stability", () => {
  const LABEL_ROWS = stageOperatorMap.stages.map((stage) => [
    stage.id,
    stage.label_operator_short,
    stage.label_operator_long,
  ]) as Array<[string, string, string]>;

  it.each(LABEL_ROWS)(
    "short + long labels resolve for %s",
    (id, shortLabel, longLabel) => {
      const shortResult = resolveByLabel(shortLabel);
      expect(shortResult.ok).toBe(true);
      if (shortResult.ok) {
        expect(shortResult.stageId).toBe(id);
      }

      const longResult = resolveByLabel(longLabel);
      expect(longResult.ok).toBe(true);
      if (longResult.ok) {
        expect(longResult.stageId).toBe(id);
      }
    },
  );
});

describe("Deprecation guard", () => {
  const DEPRECATED_WORKSTREAM_NAMES = [
    "Go-to-Market and Distribution",
    "Delivery Operations",
    "Customer / Guest Experience and Support",
    "Finance and Risk / Compliance",
    "Data and Measurement",
    "Domain: Customer Discovery",
    "Domain: Go-to-Market",
  ];

  it.each(DEPRECATED_WORKSTREAM_NAMES)(
    "deprecated term %s does not resolve as a label",
    (term) => {
      const result = resolveByLabel(term);
      expect(result.ok).toBe(false);
    },
  );
});

describe("Alias stability", () => {
  const ALIAS_ROWS = Object.entries(stageOperatorMap.alias_index) as Array<
    [string, string]
  >;

  it.each(ALIAS_ROWS)("alias %s resolves to %s", (alias, expectedId) => {
    const result = resolveByAlias(alias);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe(expectedId);
    }
  });

  it("alias lookup is case-insensitive", () => {
    const result = resolveByAlias("GTM");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stageId).toBe("SELL-01");
    }
  });

  it("unknown alias returns ok:false", () => {
    const result = resolveByAlias("nonexistent-stage-xyz");
    expect(result.ok).toBe(false);
  });
});
