import type { TextTheme } from "../textThemes";

interface TextThemeSelectorProps {
  textThemes: TextTheme[];
  appliedTheme: TextTheme | null;
  label: string;
  customLabel?: string;
  onSelect: (themeId: string) => void;
}

export default function TextThemeSelector({
  textThemes,
  appliedTheme,
  label,
  customLabel = "Custom",
  onSelect,
}: TextThemeSelectorProps) {
  if (textThemes.length === 0) return null;

  return (
    <div className="space-y-1">
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        <select
          className="rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
          value={appliedTheme?.id ?? ""}
          onChange={(event) => onSelect(event.target.value)}
        >
          <option value="">{customLabel}</option>
          {textThemes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
