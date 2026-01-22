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
} from "@acme/design-system/shadcn";
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

// Attributes available to segment rules. Labels resolved via i18n keys at render time.
const attributes = [
  { value: "lifetime_value" },
  { value: "purchase_count" },
  { value: "country" },
  { value: "last_order_date" },
];

// Operator options. Labels resolved via i18n keys at render time.
const operatorOptions: { value: SegmentOperator }[] = [
  { value: "equals" },
  { value: "contains" },
  { value: "greaterThan" },
  { value: "lessThan" },
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
                  <SelectValue placeholder={t("cms.marketing.segments.rules.attribute.label")} />
                </SelectTrigger>
                <SelectContent>
                  {attributes.map((attr) => (
                    <SelectItem key={attr.value} value={attr.value}>
                      {t(`cms.marketing.segments.attributes.${attr.value}`)}
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
                  <SelectValue placeholder={t("cms.marketing.segments.rules.operator.label")} />
                </SelectTrigger>
                <SelectContent>
                  {operatorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(`cms.marketing.segments.operators.${option.value}`)}
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
                {t("actions.remove")}
              </Button>
            </div>
          ))}
          {errors.rules && (
            <p
              className="text-danger text-xs"
              /* i18n-exempt -- ABC-123 token reference string [ttl=2026-12-31] */
              data-token="--color-danger"
            >
              {errors.rules}
            </p>
          )}
          <Button type="button" variant="outline" onClick={onRuleAdd}>
            {t("cms.marketing.segments.rules.add")}
          </Button>
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          {t("actions.back")}
        </Button>
        <Button onClick={onNext}>{t("cms.marketing.segments.review.cta")}</Button>
      </div>
    </div>
  );
}
