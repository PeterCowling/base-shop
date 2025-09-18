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
import { type DiscountFormValues, type DiscountType } from "./types";
import {
  type DiscountErrors,
  type DiscountFormUpdater,
} from "./hooks/useDiscountFormState";

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
  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="discount-code" className="text-sm font-medium">
            Code
          </label>
          <Input
            id="discount-code"
            value={values.code}
            onChange={(event) => onChange("code", event.target.value.toUpperCase())}
            aria-invalid={errors.code ? "true" : "false"}
            aria-describedby={errors.code ? "discount-code-error" : undefined}
          />
          {errors.code && (
            <p
              id="discount-code-error"
              className="text-danger text-xs"
              data-token="--color-danger"
            >
              {errors.code}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Discount type</label>
          <Select
            value={values.type}
            onValueChange={(value) => onChange("type", value as DiscountType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label htmlFor="discount-value" className="text-sm font-medium">
            Value
          </label>
          <Input
            id="discount-value"
            type="number"
            min={1}
            value={String(values.value)}
            onChange={(event) => onChange("value", Number(event.target.value || 0))}
            aria-invalid={errors.value ? "true" : "false"}
            aria-describedby={errors.value ? "discount-value-error" : undefined}
          />
          {errors.value && (
            <p
              id="discount-value-error"
              className="text-danger text-xs"
              data-token="--color-danger"
            >
              {errors.value}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="discount-min-purchase" className="text-sm font-medium">
            Minimum purchase
          </label>
          <Input
            id="discount-min-purchase"
            type="number"
            min={0}
            value={String(values.minPurchase)}
            onChange={(event) =>
              onChange("minPurchase", Number(event.target.value || 0))
            }
            aria-invalid={errors.minPurchase ? "true" : "false"}
            aria-describedby={
              errors.minPurchase ? "discount-min-error" : undefined
            }
          />
          {errors.minPurchase && (
            <p
              id="discount-min-error"
              className="text-danger text-xs"
              data-token="--color-danger"
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
  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="discount-start" className="text-sm font-medium">
            Start date
          </label>
          <Input
            id="discount-start"
            type="date"
            value={values.startDate}
            onChange={(event) => onChange("startDate", event.target.value)}
            aria-invalid={errors.startDate ? "true" : "false"}
            aria-describedby={errors.startDate ? "discount-start-error" : undefined}
          />
          {errors.startDate && (
            <p
              id="discount-start-error"
              className="text-danger text-xs"
              data-token="--color-danger"
            >
              {errors.startDate}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="discount-end" className="text-sm font-medium">
            End date
          </label>
          <Input
            id="discount-end"
            type="date"
            value={values.endDate}
            onChange={(event) => onChange("endDate", event.target.value)}
            aria-invalid={errors.endDate ? "true" : "false"}
            aria-describedby={errors.endDate ? "discount-end-error" : undefined}
          />
          {errors.endDate && (
            <p
              id="discount-end-error"
              className="text-danger text-xs"
              data-token="--color-danger"
            >
              {errors.endDate}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="discount-usage" className="text-sm font-medium">
            Usage limit
          </label>
          <Input
            id="discount-usage"
            type="number"
            min={0}
            value={String(values.usageLimit)}
            onChange={(event) => onChange("usageLimit", Number(event.target.value || 0))}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="discount-applies" className="text-sm font-medium">
            Applies to
          </label>
          <Textarea
            id="discount-applies"
            rows={2}
            value={values.appliesTo}
            onChange={(event) => onChange("appliesTo", event.target.value)}
            aria-invalid={errors.appliesTo ? "true" : "false"}
            aria-describedby={errors.appliesTo ? "discount-applies-error" : undefined}
          />
          {errors.appliesTo && (
            <p
              id="discount-applies-error"
              className="text-danger text-xs"
              data-token="--color-danger"
            >
              {errors.appliesTo}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
