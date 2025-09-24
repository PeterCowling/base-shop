// apps/cms/src/app/cms/shop/[shop]/sections/history/page.tsx
import "server-only";
import { requirePermission } from "@auth";
import { listSectionHistory } from "@acme/platform-core/repositories/sections/sections.json.server";
import type { SectionTemplate } from "@acme/types";

export const dynamic = "force-dynamic";

export default async function SectionsHistoryPage({ params }: { params: { shop: string } }) {
  await requirePermission("manage_pages");
  const { shop } = params;
  const history = await listSectionHistory(shop);
  const items = Array.isArray(history) ? history : [];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Sections History</h1>
      {items.length === 0 && (
        <p className="text-sm text-neutral-600">No history yet.</p>
      )}
      <ul className="space-y-3">
        {items.map((e: any, idx: number) => (
          <li key={idx} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-700">
                <div><span className="font-medium">Type:</span> {String(e.type)}</div>
                <div><span className="font-medium">Section ID:</span> {String(e.id ?? e.after?.id ?? e.before?.id ?? "-")}</div>
                <div><span className="font-medium">At:</span> {String(e.at ?? e.detectedAt ?? "-")}</div>
              </div>
              {e.after && (
                <form
                  action={`/api/sections/${encodeURIComponent(shop)}/restore`}
                  method="post"
                  className="ml-4"
                >
                  <input type="hidden" name="snapshot" value={JSON.stringify(e.after as SectionTemplate)} />
                  <button type="submit" className="rounded border bg-white px-3 py-1 text-sm hover:bg-neutral-50">Restore</button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

