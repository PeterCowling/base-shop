import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../atoms/shadcn";
import type { ValidationErrors } from "../shared";
import type {
  SegmentDefinition,
  SegmentOperator,
  SegmentRule,
} from "./types";

interface SegmentRulesStepProps {
  definition: SegmentDefinition;
  errors: ValidationErrors<"name" | "rules">;
  onRuleChange: (ruleId: string, patch: Partial<SegmentRule>) => void;
  onRuleAdd: () => void;
  onRuleRemove: (ruleId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const attributes = [
  { value: "lifetime_value", label: "Lifetime value" },
  { value: "purchase_count", label: "Orders placed" },
  { value: "country", label: "Country" },
  { value: "last_order_date", label: "Last order date" },
];

const operatorOptions: { value: SegmentOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "greaterThan", label: "Greater than" },
  { value: "lessThan", label: "Less than" },
];

export function SegmentRulesStep({
  definition,
  errors,
  onRuleChange,
  onRuleAdd,
  onRuleRemove,
  onBack,
  onNext,
}: SegmentRulesStepProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          {definition.rules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
            >
              <Select
                value={rule.attribute}
                onValueChange={(value) => onRuleChange(rule.id, { attribute: value })}
              >
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Attribute" />
                </SelectTrigger>
                <SelectContent>
                  {attributes.map((attr) => (
                    <SelectItem key={attr.value} value={attr.value}>
                      {attr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={rule.operator}
                onValueChange={(value) =>
                  onRuleChange(rule.id, {
                    operator: value as SegmentOperator,
                  })
                }
              >
                <SelectTrigger className="min-w-[140px]">
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {operatorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={rule.value}
                onChange={(event) => onRuleChange(rule.id, { value: event.target.value })}
                className="min-w-[160px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => onRuleRemove(rule.id)}
                disabled={definition.rules.length === 1}
              >
                Remove
              </Button>
            </div>
          ))}
          {errors.rules && (
            <p className="text-danger text-xs" data-token="--color-danger">
              {errors.rules}
            </p>
          )}
          <Button type="button" variant="outline" onClick={onRuleAdd}>
            Add rule
          </Button>
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Review segment</Button>
      </div>
    </div>
  );
}
