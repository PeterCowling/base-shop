import type { FormEvent } from "react";
import { Button, Card, CardContent, Input, Textarea } from "../../../atoms/shadcn";
import { useTranslations } from "@acme/i18n";
import type { ValidationErrors } from "../shared";
import type { SegmentDefinition } from "./types";

interface SegmentDetailsStepProps {
  definition: SegmentDefinition;
  errors: ValidationErrors<"name" | "rules">;
  onDefinitionChange: (patch: Partial<SegmentDefinition>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function SegmentDetailsStep({
  definition,
  errors,
  onDefinitionChange,
  onSubmit,
}: SegmentDetailsStepProps) {
  const t = useTranslations();
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label
              /* i18n-exempt — non-user-facing id reference */
              htmlFor="segment-name"
              className="text-sm font-medium"
            >
              {t("Segment name")}
            </label>
            <Input
              /* i18n-exempt — non-user-facing id */
              id="segment-name"
              value={definition.name}
              onChange={(event) =>
                onDefinitionChange({ name: event.target.value })
              }
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={
                // i18n-exempt — non-user-facing id reference
                errors.name ? "segment-name-error" : undefined
              }
            />
            {errors.name && (
              <p
                /* i18n-exempt — non-user-facing id */
                id="segment-name-error"
                className="text-danger text-xs"
                /* i18n-exempt — token reference string */
                data-token="--color-danger"
              >
                {errors.name}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label
                /* i18n-exempt — non-user-facing id reference */
                htmlFor="segment-description"
                className="text-sm font-medium"
              >
                {t("Description")}
              </label>
              <Textarea
                /* i18n-exempt — non-user-facing id */
                id="segment-description"
                rows={3}
                value={definition.description}
                onChange={(event) =>
                  onDefinitionChange({ description: event.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label
                /* i18n-exempt — non-user-facing id reference */
                htmlFor="segment-size"
                className="text-sm font-medium"
              >
                {t("Estimated size")}
              </label>
              <Input
                /* i18n-exempt — non-user-facing id */
                id="segment-size"
                type="number"
                min={0}
                value={String(definition.estimatedSize)}
                onChange={(event) =>
                  onDefinitionChange({
                    estimatedSize: Number(event.target.value || 0),
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="submit">{t("Continue")}</Button>
      </div>
    </form>
  );
}
