import "server-only";
import { requirePermission } from "@auth";
import { listPresets } from "@acme/platform-core/repositories/sections/presets.server";
import type { SectionPreset } from "@acme/types";

export const dynamic = "force-dynamic";

export default async function PresetsAdminPage({ params }: { params: { shop: string } }) {
  await requirePermission("manage_pages");
  const { shop } = params;
  const presets = await listPresets(shop);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">Section Presets</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Create Preset</h2>
        <form action={`/api/sections/${encodeURIComponent(shop)}/presets`} method="post" className="space-y-2">
          <input type="hidden" name="__json" value="1" />
          <div>
            <label className="block text-sm">Label</label>
            <input name="label" required className="w-full rounded border p-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm">Locked keys (comma separated, optional)</label>
            <input name="locked" className="w-full rounded border p-2 text-sm" placeholder="e.g. contentWidth,density" />
          </div>
          <div>
            <label className="block text-sm">Template JSON (PageComponent)</label>
            <textarea name="template" required rows={8} className="w-full rounded border p-2 font-mono text-xs" placeholder='{"id":"...","type":"Section",...}' />
          </div>
          <button type="submit" className="rounded border bg-white px-3 py-1 text-sm hover:bg-neutral-50">Save Preset</button>
        </form>
        <p className="text-xs text-neutral-600">Paste a PageComponent JSON (root should be a Section). The preset is inserted as a clone when used.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Existing Presets</h2>
        {presets.length === 0 ? (
          <p className="text-sm text-neutral-600">No presets yet.</p>
        ) : (
          <ul className="space-y-2">
            {presets.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <div className="font-medium">{p.label}</div>
                  {Array.isArray(p.locked) && p.locked.length > 0 && (
                    <div className="text-xs text-neutral-600">Locked: {p.locked.join(", ")}</div>
                  )}
                </div>
                <form
                  action={`/api/sections/${encodeURIComponent(shop)}/presets?id=${encodeURIComponent(p.id)}`}
                  method="post"
                  onSubmit={(e) => {
                    const methodInput = (e.currentTarget as any)._method as HTMLInputElement | undefined;
                    if (methodInput) methodInput.value = "DELETE";
                  }}
                >
                  <input type="hidden" name="_method" value="DELETE" />
                  <button type="submit" className="rounded border px-3 py-1 text-sm hover:bg-neutral-50">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
