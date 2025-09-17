"use client";

import { useState } from "react";
import { z } from "zod";
import { Button, Card, CardContent, Input, Textarea } from "@ui/components/atoms";
import { FormField } from "@ui/components/molecules";
import type { ActionResult } from "../../components/actionResult";

const filterSchema = z.object({
  field: z.string().min(1, "Choose a filter field."),
  value: z.string().min(1, "Provide a filter value."),
});

const formSchema = z
  .object({
    shop: z.string().min(1, "Enter the shop slug."),
    id: z.string().min(1, "Provide a unique segment ID."),
    name: z.string().min(1, "Give the segment a human readable name."),
    filters: z.array(filterSchema).min(1, "Add at least one filter."),
  })
  .transform((data) => ({
    ...data,
    filters: data.filters.map((filter) => ({
      field: filter.field.trim(),
      value: filter.value.trim(),
    })),
  }));

type FormErrors = Partial<Record<"shop" | "id" | "name" | `filters.${number}.field` | `filters.${number}.value`, string>>;

interface FilterRow {
  field: string;
  value: string;
}

const filterOptions = [
  { label: "Event type", value: "type", helper: "Matches analytics event types such as email_open or purchase." },
  { label: "Tag", value: "tag", helper: "Matches contact tags synced from ESPs." },
  { label: "Source", value: "source", helper: "Matches acquisition source from UTM parameters." },
];

export interface SegmentDesignerProps {
  saveSegment: (payload: z.infer<typeof formSchema>) => Promise<ActionResult>;
  onNotify: (result: ActionResult) => void;
}

export function SegmentDesigner({ saveSegment, onNotify }: SegmentDesignerProps) {
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
          next[`filters.${index}.${field}`] = issue.message;
        } else if (typeof key === "string") {
          next[key as keyof FormErrors] = issue.message;
        }
      }
      setErrors(next);
      setIsSubmitting(false);
      return;
    }

    const result = await saveSegment(parsed.data);
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
          <h2 className="text-lg font-semibold text-foreground">Segment builder</h2>
          <p className="text-sm text-muted-foreground">
            Define rules using analytics events, tags, or custom metadata. Segments refresh nightly.
          </p>
        </header>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Shop" htmlFor="segment-shop" error={errors.shop} required>
              <Input
                id="segment-shop"
                placeholder="bcd"
                value={form.shop}
                onChange={(event) => updateField("shop", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Use a shop slug to scope analytics data.</p>
            </FormField>
            <FormField label="Segment ID" htmlFor="segment-id" error={errors.id} required>
              <Input
                id="segment-id"
                placeholder="vip-subscribers"
                value={form.id}
                onChange={(event) => updateField("id", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This identifier syncs to the email service provider and must be unique per shop.
              </p>
            </FormField>
            <FormField label="Name" htmlFor="segment-name" error={errors.name} required>
              <Input
                id="segment-name"
                placeholder="VIP subscribers"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Shown in composer dropdowns and dashboards.</p>
            </FormField>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Filters</h3>
            <p className="text-xs text-muted-foreground">
              Combine filters with AND logic. Multiple segments can be created to support different lifecycle stages.
            </p>
            <div className="space-y-4">
              {filters.map((filter, index) => {
                const helper = filterOptions.find((option) => option.value === filter.field)?.helper;
                return (
                  <div key={index} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
                    <FormField
                      label="Field"
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
                      label="Value"
                      htmlFor={`segment-filter-value-${index}`}
                      error={errors[`filters.${index}.value`]}
                      required
                    >
                      <Input
                        id={`segment-filter-value-${index}`}
                        placeholder="purchase"
                        value={filter.value}
                        onChange={(event) => updateFilter(index, "value", event.target.value)}
                      />
                      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
                    </FormField>
                    <div className="flex items-end justify-end">
                      {filters.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-xs text-destructive"
                          onClick={() => removeFilter(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button type="button" variant="outline" className="h-9 px-3 text-sm" onClick={addFilter}>
              Add filter
            </Button>
          </div>

          <FormField label="Notes" htmlFor="segment-notes">
            <Textarea
              id="segment-notes"
              rows={3}
              placeholder="Optional context for your marketing team"
              value="Segments save automatically and can be reused across email and discount workflows."
              readOnly
              className="resize-none text-sm text-muted-foreground"
            />
          </FormField>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save segment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default SegmentDesigner;
