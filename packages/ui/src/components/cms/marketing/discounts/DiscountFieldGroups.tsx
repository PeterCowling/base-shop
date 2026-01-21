import { useTranslations } from "@acme/i18n";

import {
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "../../../atoms/shadcn";

import {
  type DiscountErrors,
  type DiscountFormUpdater,
} from "./hooks/useDiscountFormState";
import { type DiscountFormValues, type DiscountType } from "./types";

interface DiscountFieldGroupProps {
  values: DiscountFormValues;
  errors: DiscountErrors;
  onChange: DiscountFormUpdater;
}

export function DiscountConfigurationCard({
  values,
  errors,
  onChange,
}: DiscountFieldGroupProps) {
  const t = useTranslations();
  // i18n-exempt constants for control ids/tokens/values
  // i18n-exempt
  const CODE_ID = "discount-code";
  // i18n-exempt
  const CODE_ERR_ID = "discount-code-error";
  // i18n-exempt
  const VALUE_ID = "discount-value";
  // i18n-exempt
  const VALUE_ERR_ID = "discount-value-error";
  // i18n-exempt
  const MIN_ID = "discount-min-purchase";
  // i18n-exempt
  const MIN_ERR_ID = "discount-min-error";
  // i18n-exempt
  const DANGER_TOKEN = "--color-danger";
  // i18n-exempt
  const NUMBER = "number";
  // i18n-exempt
  const FIXED = "fixed";
  // i18n-exempt
  const PERCENTAGE = "percentage";
  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={CODE_ID} className="text-sm font-medium">
            {t("Code")}
          </label>
          <Input
            id={CODE_ID}
            value={values.code}
            onChange={(event) => onChange("code", event.target.value.toUpperCase())}
            aria-invalid={errors.code ? "true" : "false"}
            aria-describedby={errors.code ? CODE_ERR_ID : undefined}
          />
          {errors.code && (
            <p
              id={CODE_ERR_ID}
              className="text-danger text-xs"
              data-token={DANGER_TOKEN}
            >
              {errors.code}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("Discount type")}</label>
          <Select
            value={values.type}
            onValueChange={(value) => onChange("type", value as DiscountType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PERCENTAGE}>{t("Percentage")}</SelectItem>
              <SelectItem value={FIXED}>{t("Fixed amount")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label htmlFor={VALUE_ID} className="text-sm font-medium">
            {t("Value")}
          </label>
          <Input
            id={VALUE_ID}
            type={NUMBER}
            min={1}
            value={String(values.value)}
            onChange={(event) => onChange("value", Number(event.target.value || 0))}
            aria-invalid={errors.value ? "true" : "false"}
            aria-describedby={errors.value ? VALUE_ERR_ID : undefined}
          />
          {errors.value && (
            <p
              id={VALUE_ERR_ID}
              className="text-danger text-xs"
              data-token={DANGER_TOKEN}
            >
              {errors.value}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor={MIN_ID} className="text-sm font-medium">
            {t("Minimum purchase")}
          </label>
          <Input
            id={MIN_ID}
            type={NUMBER}
            min={0}
            value={String(values.minPurchase)}
            onChange={(event) =>
              onChange("minPurchase", Number(event.target.value || 0))
            }
            aria-invalid={errors.minPurchase ? "true" : "false"}
            aria-describedby={
              errors.minPurchase ? MIN_ERR_ID : undefined
            }
          />
          {errors.minPurchase && (
            <p
              id={MIN_ERR_ID}
              className="text-danger text-xs"
              data-token={DANGER_TOKEN}
            >
              {errors.minPurchase}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DiscountScheduleCard({
  values,
  errors,
  onChange,
}: DiscountFieldGroupProps) {
  const t = useTranslations();
  // i18n-exempt constants for control ids/tokens/types
  // i18n-exempt
  const START_ID = "discount-start";
  // i18n-exempt
  const START_ERR_ID = "discount-start-error";
  // i18n-exempt
  const END_ID = "discount-end";
  // i18n-exempt
  const END_ERR_ID = "discount-end-error";
  // i18n-exempt
  const USAGE_ID = "discount-usage";
  // i18n-exempt
  const APPLIES_ID = "discount-applies";
  // i18n-exempt
  const APPLIES_ERR_ID = "discount-applies-error";
  // i18n-exempt
  const DANGER_TOKEN = "--color-danger";
  // i18n-exempt
  const DATE = "date";
  // i18n-exempt
  const NUMBER = "number";
  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={START_ID} className="text-sm font-medium">
            {t("Start date")}
          </label>
          <Input
            id={START_ID}
            type={DATE}
            value={values.startDate}
            onChange={(event) => onChange("startDate", event.target.value)}
            aria-invalid={errors.startDate ? "true" : "false"}
            aria-describedby={errors.startDate ? START_ERR_ID : undefined}
          />
          {errors.startDate && (
            <p
              id={START_ERR_ID}
              className="text-danger text-xs"
              data-token={DANGER_TOKEN}
            >
              {errors.startDate}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor={END_ID} className="text-sm font-medium">
            {t("End date")}
          </label>
          <Input
            id={END_ID}
            type={DATE}
            value={values.endDate}
            onChange={(event) => onChange("endDate", event.target.value)}
            aria-invalid={errors.endDate ? "true" : "false"}
            aria-describedby={errors.endDate ? END_ERR_ID : undefined}
          />
          {errors.endDate && (
            <p
              id={END_ERR_ID}
              className="text-danger text-xs"
              data-token={DANGER_TOKEN}
            >
              {errors.endDate}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor={USAGE_ID} className="text-sm font-medium">
            {t("Usage limit")}
          </label>
          <Input
            id={USAGE_ID}
            type={NUMBER}
            min={0}
            value={String(values.usageLimit)}
            onChange={(event) => onChange("usageLimit", Number(event.target.value || 0))}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor={APPLIES_ID} className="text-sm font-medium">
            {t("Applies to")}
          </label>
          <Textarea
            id={APPLIES_ID}
            rows={2}
            value={values.appliesTo}
            onChange={(event) => onChange("appliesTo", event.target.value)}
            aria-invalid={errors.appliesTo ? "true" : "false"}
            aria-describedby={errors.appliesTo ? APPLIES_ERR_ID : undefined}
          />
          {errors.appliesTo && (
            <p
              id={APPLIES_ERR_ID}
              className="text-danger text-xs"
              data-token={DANGER_TOKEN}
            >
              {errors.appliesTo}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
