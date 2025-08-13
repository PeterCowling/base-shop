"use client";

interface Field {
  type: string;
  name: string;
  label?: string;
  options?: { label: string; value: string }[];
}

interface Props {
  action?: string;
  method?: string;
  fields?: Field[];
}

export default function FormBuilderBlock({
  action = "#",
  method = "post",
  fields = [],
}: Props) {
  return (
    <form className="space-y-2" action={action} method={method}>
      {fields.map((field) => {
        const key = field.name;
        const label = field.label;
        switch (field.type) {
          case "textarea":
            return (
              <div key={key} className="space-y-1">
                {label && (
                  <label htmlFor={key} className="block text-sm font-medium">
                    {label}
                  </label>
                )}
                <textarea
                  id={key}
                  name={field.name}
                  className="w-full rounded border p-2"
                />
              </div>
            );
          case "select":
            return (
              <div key={key} className="space-y-1">
                {label && (
                  <label htmlFor={key} className="block text-sm font-medium">
                    {label}
                  </label>
                )}
                <select
                  id={key}
                  name={field.name}
                  className="w-full rounded border p-2"
                >
                  {(field.options ?? []).map((opt) => (
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
                {label && (
                  <label htmlFor={key} className="block text-sm font-medium">
                    {label}
                  </label>
                )}
                <input
                  id={key}
                  type={field.type}
                  name={field.name}
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
        Submit
      </button>
    </form>
  );
}

