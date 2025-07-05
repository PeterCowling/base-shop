"use client";

interface FontSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FontSelect({
  value,
  options,
  onChange,
  onUpload,
}: FontSelectProps) {
  return (
    <span className="flex flex-col gap-1">
      <select
        className="flex-1 rounded border p-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ fontFamily: o }}>
            {o}
          </option>
        ))}
      </select>
      <input type="file" accept=".woff,.woff2,.ttf,.otf" onChange={onUpload} />
    </span>
  );
}
