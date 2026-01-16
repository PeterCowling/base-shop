import type { ProductConfigSchema, SelectionState } from "@acme/product-configurator";
import { validateSelections } from "../rulesEngine";
import type { RuleDefinition } from "../types";

const schema: ProductConfigSchema = {
  productId: "bag-001",
  version: "0.1.0",
  regions: [
    { regionId: "body", displayName: "Body" },
    { regionId: "lining", displayName: "Lining" },
    { regionId: "personalization", displayName: "Personalization" },
  ],
  properties: [
    {
      key: "bodyMaterial",
      displayName: "Body",
      regionId: "body",
      type: "enum",
      values: [
        { value: "black", label: "Black" },
        { value: "white", label: "White" },
      ],
      defaultValue: "black",
    },
    {
      key: "lining",
      displayName: "Lining",
      regionId: "lining",
      type: "enum",
      values: [
        { value: "tan", label: "Tan" },
        { value: "black", label: "Black" },
      ],
      defaultValue: "tan",
    },
    {
      key: "monogram",
      displayName: "Monogram",
      regionId: "personalization",
      type: "enum",
      values: [
        { value: "none", label: "None" },
        { value: "embossed", label: "Embossed" },
      ],
      defaultValue: "none",
    },
  ],
};

const rules: RuleDefinition[] = [
  {
    type: "requires",
    if: { key: "monogram", in: ["embossed"] },
    then: { key: "bodyMaterial", in: ["black"] },
    code: "MONO_BODY",
    message: "Monogram requires black body.",
  },
  {
    type: "restrictDomain",
    if: { key: "bodyMaterial", in: ["white"] },
    then: { key: "lining", in: ["tan"] },
    code: "LINING_LIMIT",
    message: "White body only pairs with tan lining.",
  },
  {
    type: "excludes",
    if: { key: "bodyMaterial", in: ["black"] },
    then: { key: "lining", in: ["black"] },
    code: "NO_BLACK_LINING",
    message: "Black body excludes black lining.",
  },
];

describe("rulesEngine.validateSelections", () => {
  it("normalizes invalid selections and reports invalid reason", () => {
    const selections: SelectionState = { bodyMaterial: "invalid" };
    const result = validateSelections({ schema, rules, selections });

    expect(result.normalizedSelections.bodyMaterial).toBe("black");
    expect(result.blockedReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_SELECTION" }),
      ]),
    );
  });

  it("flags requires violations", () => {
    const selections: SelectionState = {
      bodyMaterial: "white",
      monogram: "embossed",
      lining: "tan",
    };
    const result = validateSelections({ schema, rules, selections });

    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MONO_BODY" }),
      ]),
    );
  });

  it("computes allowed domain deltas for restrict and exclude rules", () => {
    const selections: SelectionState = {
      bodyMaterial: "white",
      monogram: "none",
      lining: "tan",
    };
    const result = validateSelections({ schema, rules, selections });

    expect(result.allowedDomainsDelta.lining).toEqual(["tan"]);
  });
});

