import { themeLibrary } from "../../../api/themes/store";

export default function ThemeLibraryPage() {
  const themes = themeLibrary;
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Theme Library</h2>
      <ul className="space-y-2">
        {themes.map((t) => (
          <li key={t.id} className="flex items-center gap-2">
            <span
              className="inline-block h-4 w-4 rounded"
              style={{ backgroundColor: t.brandColor }}
            />
            <span>{t.name}</span>
          </li>
        ))}
        {themes.length === 0 && <li>No themes.</li>}
      </ul>
    </div>
  );
}
