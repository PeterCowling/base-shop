export type SegmentOperator = "equals" | "contains" | "greaterThan" | "lessThan";

export interface SegmentRule {
  id: string;
  attribute: string;
  operator: SegmentOperator;
  value: string;
}

export interface SegmentDefinition {
  name: string;
  description: string;
  rules: SegmentRule[];
  estimatedSize: number;
}

export interface SegmentPreviewData {
  name: string;
  description: string;
  rules: SegmentRule[];
  estimatedSize: number;
}

export const defaultSegmentDefinition: SegmentDefinition = {
  name: "",
  description: "",
  rules: [
    {
      id: "rule-1",
      attribute: "lifetime_value",
      operator: "greaterThan",
      value: "500",
    },
  ],
  estimatedSize: 0,
};

export function getSegmentPreview(
  definition: SegmentDefinition
): SegmentPreviewData {
  return {
    // i18n-exempt — default placeholder when no name provided; surfaced via UI components which handle i18n
    name: definition.name || "Untitled segment",
    description:
      definition.description ||
      // i18n-exempt — default helper shown when no description provided; UI handles i18n for user-facing copy
      "Combine filters to target a meaningful audience.",
    rules: definition.rules,
    estimatedSize: definition.estimatedSize,
  };
}
