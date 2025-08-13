"use client";

interface BaseField {
  name: string;
  label?: string;
}

interface InputField extends BaseField {
  type: "text" | "email";
  placeholder?: string;
}

interface TextareaField extends BaseField {
  type: "textarea";
  placeholder?: string;
}

interface SelectField extends BaseField {
  type: "select";
  options: { label: string; value: string }[];
}

export type FormField = InputField | TextareaField | SelectField;

interface Props {
  action?: string;
  method?: string;
  submitLabel?: string;
  fields?: FormField[];
}

export default function FormBuilderBlock({
  action = "#",
  method = "post",
  submitLabel = "Submit",
  fields = [],
}: Props) {
  return (
    <form className="space-y-2" action={action} method={method}>
      {fields.map((field) => {
        const key = field.name;
        const label = field.label ? (
          <label htmlFor={key} className="block">
            {field.label}
          </label>
        ) : null;
        switch (field.type) {
          case "textarea":
            return (
              <div key={key} className="space-y-1">
                {label}
                <textarea
                  id={key}
                  name={field.name}
                  placeholder={field.placeholder}
                  className="w-full rounded border p-2"
                />
              </div>
            );
          case "select":
            return (
              <div key={key} className="space-y-1">
                {label}
                <select
                  id={key}
                  name={field.name}
                  className="w-full rounded border p-2"
                >
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          default:
            return (
              <div key={key} className="space-y-1">
                {label}
                <input
                  id={key}
                  type={field.type}
                  name={field.name}
                  placeholder={field.placeholder}
                  className="w-full rounded border p-2"
                />
              </div>
            );
        }
      })}
      <button
        type="submit"
        className="rounded bg-primary px-4 py-2 text-primary-fg"
      >
        {submitLabel}
      </button>
    </form>
  );
}

