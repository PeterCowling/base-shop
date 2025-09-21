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
  return (
    <span className={`flex min-w-0 flex-col gap-1 ${className ?? ""}`}>
      <select
        className="flex-1 min-w-0 rounded border p-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ fontFamily: o }}>
            {o}
          </option>
        ))}
      </select>
      <input className="block w-full max-w-full" type="file" accept=".woff,.woff2,.ttf,.otf" onChange={onUpload} />
    </span>
  );
}
