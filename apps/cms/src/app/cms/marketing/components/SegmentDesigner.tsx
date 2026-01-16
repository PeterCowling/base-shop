"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { Button, Card, CardContent, Input, Textarea } from "@ui/components/atoms";
import { Grid, Inline, Cluster } from "@ui/components/atoms/primitives";
import { FormField } from "@ui/components/molecules";
import { useTranslations } from "@acme/i18n";
import type { ActionResult } from "../../components/actionResult";

// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const ID_SEGMENT_SHOP = "segment-shop";
// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const ID_SEGMENT_ID = "segment-id";
// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const ID_SEGMENT_NAME = "segment-name";
// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const ID_SEGMENT_NOTES = "segment-notes";

function createSchemas(t: ReturnType<typeof useTranslations>) {
  const filterSchema = z.object({
    field: z.string().min(1, t("cms.marketing.segmentDesigner.errors.filter.field.required") as string),
    value: z.string().min(1, t("cms.marketing.segmentDesigner.errors.filter.value.required") as string),
  });

  const formSchema = z
    .object({
      shop: z.string().min(1, t("cms.marketing.segmentDesigner.errors.shop.required") as string),
      id: z.string().min(1, t("cms.marketing.segmentDesigner.errors.id.required") as string),
      name: z.string().min(1, t("cms.marketing.segmentDesigner.errors.name.required") as string),
      filters: z
        .array(filterSchema)
        .min(1, t("cms.marketing.segmentDesigner.errors.filters.required") as string),
    })
    .transform((data) => ({
      ...data,
      filters: data.filters.map((filter) => ({
        field: filter.field.trim(),
        value: filter.value.trim(),
      })),
    }));

  return { filterSchema, formSchema };
}

type FormErrors = Partial<Record<"shop" | "id" | "name" | `filters.${number}.field` | `filters.${number}.value`, string>>;

interface FilterRow {
  field: string;
  value: string;
}

interface FilterOptionDef {
  label: string;
  value: string;
  helper: string;
}

type SegmentPayload = {
  shop: string;
  id: string;
  name: string;
  filters: { field: string; value: string }[];
};

export interface SegmentDesignerProps {
  saveSegment: (payload: SegmentPayload) => Promise<ActionResult>;
  onNotify: (result: ActionResult) => void;
}

export function SegmentDesigner({ saveSegment, onNotify }: SegmentDesignerProps) {
  const t = useTranslations();
  const { formSchema } = useMemo(() => createSchemas(t), [t]);
  const filterOptions: FilterOptionDef[] = useMemo(
    () => [
      {
        label: String(t("cms.marketing.segmentDesigner.option.type.label")),
        value: "type",
        helper: String(t("cms.marketing.segmentDesigner.option.type.helper")),
      },
      {
        label: String(t("cms.marketing.segmentDesigner.option.tag.label")),
        value: "tag",
        helper: String(t("cms.marketing.segmentDesigner.option.tag.helper")),
      },
      {
        label: String(t("cms.marketing.segmentDesigner.option.source.label")),
        value: "source",
        helper: String(t("cms.marketing.segmentDesigner.option.source.helper")),
      },
    ],
    [t]
  );
  const [form, setForm] = useState({ shop: "", id: "", name: "" });
  const [filters, setFilters] = useState<FilterRow[]>([{ field: "type", value: "" }]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function updateFilter(index: number, key: keyof FilterRow, value: string) {
    setFilters((prev) => prev.map((filter, i) => (i === index ? { ...filter, [key]: value } : filter)));
    setErrors((prev) => ({ ...prev, [`filters.${index}.${key}`]: undefined }));
  }

  function addFilter() {
    setFilters((prev) => [...prev, { field: "type", value: "" }]);
  }

  function removeFilter(index: number) {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const filtered = filters.filter((filter) => filter.field && filter.value);
    const parsed = formSchema.safeParse({ ...form, filters: filtered });
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const [key, index, field] = issue.path;
        if (key === "filters" && typeof index === "number" && typeof field === "string") {
          (next as Record<string, string>)[`filters.${index}.${field}`] = issue.message;
        } else if (typeof key === "string") {
          next[key as keyof FormErrors] = issue.message;
        }
      }
      setErrors(next);
      setIsSubmitting(false);
      return;
    }

    const result = await saveSegment(parsed.data as SegmentPayload);
    onNotify(result);
    if (result.status === "success") {
      setForm({ shop: form.shop, id: "", name: "" });
      setFilters([{ field: "type", value: "" }]);
      setErrors({});
    }
    setIsSubmitting(false);
  }

  return (
    <Card>
      <CardContent className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{t("cms.marketing.segmentDesigner.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("cms.marketing.segmentDesigner.subtitle")}</p>
        </header>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Grid gap={4} className="md:grid-cols-3">
            <FormField
              label={String(t("cms.marketing.segmentDesigner.fields.shop.label"))}
              htmlFor={ID_SEGMENT_SHOP}
              error={errors.shop}
              required
            >
              <Input
                id={ID_SEGMENT_SHOP}
                placeholder={String(t("cms.marketing.segmentDesigner.fields.shop.placeholder"))}
                value={form.shop}
                onChange={(event) => updateField("shop", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("cms.marketing.segmentDesigner.fields.shop.help")}
              </p>
            </FormField>
            <FormField
              label={String(t("cms.marketing.segmentDesigner.fields.segmentId.label"))}
              htmlFor={ID_SEGMENT_ID}
              error={errors.id}
              required
            >
              <Input
                id={ID_SEGMENT_ID}
                placeholder={String(t("cms.marketing.segmentDesigner.fields.segmentId.placeholder"))}
                value={form.id}
                onChange={(event) => updateField("id", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("cms.marketing.segmentDesigner.fields.segmentId.help")}
              </p>
            </FormField>
            <FormField
              label={String(t("cms.marketing.segmentDesigner.fields.name.label"))}
              htmlFor={ID_SEGMENT_NAME}
              error={errors.name}
              required
            >
              <Input
                id={ID_SEGMENT_NAME}
                placeholder={String(t("cms.marketing.segmentDesigner.fields.name.placeholder"))}
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("cms.marketing.segmentDesigner.fields.name.help")}
              </p>
            </FormField>
          </Grid>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("cms.marketing.segmentDesigner.filters.title")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("cms.marketing.segmentDesigner.filters.subtitle")}
            </p>
            <div className="space-y-4">
              {filters.map((filter, index) => {
                const helper = filterOptions.find((option) => option.value === filter.field)?.helper;
                return (
                  <Grid key={index} gap={4} className="md:grid-cols-3">
                    <FormField
                      label={String(t("cms.marketing.segmentDesigner.filters.field.label"))}
                      htmlFor={`segment-filter-field-${index}`}
                      error={errors[`filters.${index}.field`]}
                      required
                    >
                      <select
                        id={`segment-filter-field-${index}`}
                        className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={filter.field}
                        onChange={(event) => updateFilter(index, "field", event.target.value)}
                      >
                        {filterOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField
                      label={String(t("cms.marketing.segmentDesigner.filters.value.label"))}
                      htmlFor={`segment-filter-value-${index}`}
                      error={errors[`filters.${index}.value`]}
                      required
                      className="md:col-span-2"
                    >
                      <Input
                        id={`segment-filter-value-${index}`}
                        placeholder={String(t("cms.marketing.segmentDesigner.filters.value.placeholder"))}
                        value={filter.value}
                        onChange={(event) => updateFilter(index, "value", event.target.value)}
                      />
                      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
                    </FormField>
                    <Inline alignY="end" className="justify-end">
                      {filters.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-xs text-destructive"
                          onClick={() => removeFilter(index)}
                        >
                          {t("cms.marketing.segmentDesigner.filters.remove")}
                        </Button>
                      )}
                    </Inline>
                  </Grid>
                );
              })}
            </div>
            <Button type="button" variant="outline" className="h-9 px-3 text-sm" onClick={addFilter}>
              {t("cms.marketing.segmentDesigner.filters.add")}
            </Button>
          </div>

          <FormField
            label={String(t("cms.marketing.segmentDesigner.notes.label"))}
            htmlFor={ID_SEGMENT_NOTES}
          >
            <Textarea
              id={ID_SEGMENT_NOTES}
              rows={3}
              placeholder={String(t("cms.marketing.segmentDesigner.notes.placeholder"))}
              value={String(t("cms.marketing.segmentDesigner.notes.value"))}
              readOnly
              className="resize-none text-sm text-muted-foreground"
            />
          </FormField>

          <Cluster justify="end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("cms.marketing.segmentDesigner.submit.saving")
                : t("cms.marketing.segmentDesigner.submit.save")}
            </Button>
          </Cluster>
        </form>
      </CardContent>
    </Card>
  );
}

export default SegmentDesigner;
