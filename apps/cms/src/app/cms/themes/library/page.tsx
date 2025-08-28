export const revalidate = 0;

interface LibraryResponse {
  themes: { id: string; name: string }[];
}

export default async function ThemeLibraryPage() {
  const res = await fetch("/cms/api/themes", { cache: "no-store" }).catch(() => null);
  const data: LibraryResponse = res ? await res.json() : { themes: [] };
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Theme Library</h2>
      <ul>
        {data.themes.map((t) => (
          <li key={t.id}>{t.name}</li>
        ))}
      </ul>
    </div>
  );
}
