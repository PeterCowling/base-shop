"use client";

interface Field {
  type: string;
  name: string;
  label?: string;
  placeholder?: string;
  options?: string[];
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
        if (field.type === "select") {
          return (
            <div key={field.name} className="flex flex-col gap-1">
              {field.label && (
                <label htmlFor={field.name} className="text-sm">
                  {field.label}
                </label>
              )}
              <select
                id={field.name}
                name={field.name}
                className="w-full rounded border p-2"
              >
                {(field.options ?? []).map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return (
          <div key={field.name} className="flex flex-col gap-1">
            {field.label && (
              <label htmlFor={field.name} className="text-sm">
                {field.label}
              </label>
            )}
            <input
              id={field.name}
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              className="w-full rounded border p-2"
            />
          </div>
        );
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
