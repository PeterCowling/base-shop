"use client";

import type { FormField, FormFieldOption } from "@acme/types";

interface Props {
  action?: string;
  method?: string;
  fields?: FormField[];
  submitLabel?: string;
}

export default function FormBuilderBlock({
  action = "#",
  method = "post",
  fields = [],
  submitLabel = "Submit", // i18n-exempt — fallback label; caller/CMS should localize
}: Props) {
  return (
    <form
      // i18n-exempt — CSS utility class names
      className="space-y-2"
      action={action}
      method={method}
    >
      {fields.map((field, idx) => {
        if (field.type === "select") {
          return (
            <select
              key={idx}
              name={field.name}
              // i18n-exempt — CSS utility class names
              className="w-full rounded border p-2"
            >
              {field.options?.map((opt: FormFieldOption) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {/* i18n-exempt — option labels supplied by CMS */}
                </option>
              ))}
            </select>
          );
        }
        return (
          <input
            key={idx}
            type={field.type}
            name={field.name}
            placeholder={field.label} // i18n-exempt — labels originate from CMS content
            // i18n-exempt — CSS utility class names
            className="w-full rounded border p-2"
          />
        );
      })}
      <button
        type="submit"
        // i18n-exempt — CSS utility class names
        className="rounded bg-primary px-4 py-2 min-h-10 min-w-10"
        // i18n-exempt — design token attribute, not user copy
        data-token="--color-primary"
      >
        <span
          // i18n-exempt — CSS utility class names
          className="text-primary-fg"
          // i18n-exempt — design token attribute, not user copy
          data-token="--color-primary-fg"
        >
          {submitLabel}
        </span>
      </button>
    </form>
  );
}
