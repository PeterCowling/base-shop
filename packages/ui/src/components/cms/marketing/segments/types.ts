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
    name: definition.name || "Untitled segment",
    description:
      definition.description ||
      "Combine filters to target a meaningful audience.",
    rules: definition.rules,
    estimatedSize: definition.estimatedSize,
  };
}
