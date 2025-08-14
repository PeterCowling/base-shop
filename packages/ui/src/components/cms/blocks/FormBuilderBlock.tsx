"use client";

interface FieldOption {
  label: string;
  value: string;
}

interface FieldConfig {
  type: "text" | "email" | "select";
  name: string;
  label?: string;
  options?: FieldOption[];
}

interface Props {
  action?: string;
  method?: string;
  fields?: FieldConfig[];
  submitLabel?: string;
}

export default function FormBuilderBlock({
  action = "#",
  method = "post",
  fields = [],
  submitLabel = "Submit",
}: Props) {
  return (
    <form className="space-y-2" action={action} method={method}>
      {fields.map((field, idx) => {
        if (field.type === "select") {
          return (
            <select
              key={idx}
              name={field.name}
              className="w-full rounded border p-2"
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
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
            placeholder={field.label}
            className="w-full rounded border p-2"
          />
        );
      })}
      <button
        type="submit"
        className="rounded bg-primary px-4 py-2"
        data-token="--color-primary"
      >
        <span className="text-primary-fg" data-token="--color-primary-fg">
          {submitLabel}
        </span>
      </button>
    </form>
  );
}
