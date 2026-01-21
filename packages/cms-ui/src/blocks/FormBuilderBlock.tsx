"use client";

import { useTranslations } from "@acme/i18n";
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
  submitLabel,
}: Props) {
  const t = useTranslations();
  const resolvedSubmitLabel = submitLabel ?? t("actions.submit");
  return (
    <form
      // i18n-exempt -- DS-1023: CSS utility class names only [ttl=2026-12-31]
      className="space-y-2"
      action={action}
      method={method}
    >
      {fields.map((field, idx) => {
        if (field.type === "select") {
          return (
            <select
              key={field.name ?? `select-${idx}`}
              name={field.name}
              // i18n-exempt -- DS-1023: CSS utility class names only [ttl=2026-12-31]
              className="w-full rounded border p-2"
            >
              {field.options?.map((opt: FormFieldOption) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {/* i18n-exempt -- DS-1024: option labels supplied by CMS content [ttl=2026-12-31] */}
                </option>
              ))}
            </select>
          );
        }
        return (
          <input
            key={field.name ?? `field-${idx}`}
            type={field.type}
            name={field.name}
            placeholder={field.label} // i18n-exempt -- DS-1024: labels originate from CMS content [ttl=2026-12-31]
            // i18n-exempt -- DS-1023: CSS utility class names only [ttl=2026-12-31]
            className="w-full rounded border p-2"
          />
        );
      })}
      <button
        type="submit"
        // i18n-exempt -- DS-1023: CSS utility class names only [ttl=2026-12-31]
        className="rounded bg-primary px-4 py-2 min-h-10 min-w-10"
        // i18n-exempt -- DS-1025: design token attribute, not user-facing copy [ttl=2026-12-31]
        data-token="--color-primary"
      >
        <span
          // i18n-exempt -- DS-1023: CSS utility class names only [ttl=2026-12-31]
          className="text-primary-fg"
          // i18n-exempt -- DS-1025: design token attribute, not user-facing copy [ttl=2026-12-31]
          data-token="--color-primary-fg"
        >
          {resolvedSubmitLabel}
        </span>
      </button>
    </form>
  );
}
