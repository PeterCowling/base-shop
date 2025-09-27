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
import { useTranslations } from "@acme/i18n";
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

// i18n-exempt — data constant; labels are translated at render via t()
const attributes = [
  { value: "lifetime_value", label: "Lifetime value" /* i18n-exempt — data constant; translated at render */ },
  { value: "purchase_count", label: "Orders placed" /* i18n-exempt — data constant; translated at render */ },
  { value: "country", label: "Country" /* i18n-exempt — data constant; translated at render */ },
  { value: "last_order_date", label: "Last order date" /* i18n-exempt — data constant; translated at render */ },
];

// i18n-exempt — data constant; labels are translated at render via t()
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
  const t = useTranslations();
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
                <SelectTrigger className="min-w-44">
                  <SelectValue placeholder={t("Attribute")} />
                </SelectTrigger>
                <SelectContent>
                  {attributes.map((attr) => (
                    <SelectItem key={attr.value} value={attr.value}>
                      {t(attr.label)}
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
                <SelectTrigger className="min-w-36">
                  <SelectValue placeholder={t("Operator")} />
                </SelectTrigger>
                <SelectContent>
                  {operatorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={rule.value}
                onChange={(event) => onRuleChange(rule.id, { value: event.target.value })}
                className="min-w-40"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => onRuleRemove(rule.id)}
                disabled={definition.rules.length === 1}
              >
                {t("Remove")}
              </Button>
            </div>
          ))}
          {errors.rules && (
            <p
              className="text-danger text-xs"
              /* i18n-exempt — token reference string */
              data-token="--color-danger"
            >
              {errors.rules}
            </p>
          )}
          <Button type="button" variant="outline" onClick={onRuleAdd}>
            {t("Add rule")}
          </Button>
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          {t("Back")}
        </Button>
        <Button onClick={onNext}>{t("Review segment")}</Button>
      </div>
    </div>
  );
}
