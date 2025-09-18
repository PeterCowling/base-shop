import type { FormEvent } from "react";
import { Button, Card, CardContent, Input, Textarea } from "../../../atoms/shadcn";
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
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="segment-name" className="text-sm font-medium">
              Segment name
            </label>
            <Input
              id="segment-name"
              value={definition.name}
              onChange={(event) =>
                onDefinitionChange({ name: event.target.value })
              }
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "segment-name-error" : undefined}
            />
            {errors.name && (
              <p
                id="segment-name-error"
                className="text-danger text-xs"
                data-token="--color-danger"
              >
                {errors.name}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="segment-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="segment-description"
                rows={3}
                value={definition.description}
                onChange={(event) =>
                  onDefinitionChange({ description: event.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="segment-size" className="text-sm font-medium">
                Estimated size
              </label>
              <Input
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
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
