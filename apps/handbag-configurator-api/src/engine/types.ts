export type RuleCondition = {
  key: string;
  in: string[];
};

export type RuleType = "requires" | "excludes" | "restrictDomain";

export type RuleDefinition = {
  type: RuleType;
  if: RuleCondition;
  then: RuleCondition;
  code: string;
  message: string;
};

