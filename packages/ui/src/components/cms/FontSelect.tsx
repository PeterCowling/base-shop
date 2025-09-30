/* i18n-exempt file -- ABC-123 CSS classes and file accept types only [ttl=2026-01-31] */
"use client";

interface FontSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function FontSelect({
  value,
  options,
  onChange,
  onUpload,
  className,
}: FontSelectProps) {
  const toClass = (name: string) => `fontopt-${name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase()}`;
  const css = options
    .map((o) => `.${toClass(o)}{font-family:${JSON.stringify(o)};}`)
    .join("");
  return (
    <span className={`flex min-w-0 flex-col gap-1 ${className ?? ""}`}>
      <style>{css}</style>
      <select
        className="flex-1 min-w-0 rounded border p-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option
            key={o}
            value={o}
            className={toClass(o)}
          >
            {o}
          </option>
        ))}
      </select>
      <input className="block w-full" type="file" accept=".woff,.woff2,.ttf,.otf" onChange={onUpload} />
    </span>
  );
}
