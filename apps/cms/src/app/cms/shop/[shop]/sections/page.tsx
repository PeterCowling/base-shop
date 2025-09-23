// apps/cms/src/app/cms/shop/[shop]/sections/page.tsx

import Link from "next/link";
import { getSections } from "@platform-core/repositories/sections/index.server";
import { deleteSectionAction } from "@/actions/sections/delete";
import { updateSectionAction } from "@/actions/sections/update";

export const revalidate = 0;

export default async function SectionsListRoute({ params }: { params: Promise<{ shop: string }> }) {
  const { shop } = await params;
  const sections = await getSections(shop);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sections - {shop}</h1>
        <Link className="rounded border px-3 py-1 text-sm" href={`/cms/shop/${shop}/sections/new/builder`}>
          Create Section
        </Link>
      </div>
      <ul className="divide-y rounded border">
        {sections.length === 0 && <li className="p-3 text-sm text-muted-foreground">No sections yet.</li>}
        {sections.map((s) => (
          <li key={s.id} className="flex items-center justify-between p-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.status} • {new Date(s.updatedAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <Link className="rounded border px-2 py-1 text-sm" href={`/cms/shop/${shop}/sections/${s.id}/builder`}>
                Edit
              </Link>
              <form action={async () => { "use server"; const fd = new FormData(); fd.set('id', s.id); fd.set('status', s.status === "published" ? "draft" : "published"); await updateSectionAction(shop, fd); }}>
                <button className="rounded border px-2 py-1 text-sm" type="submit">
                  {s.status === "published" ? "Unpublish" : "Publish"}
                </button>
              </form>
              <form action={async () => { "use server"; await deleteSectionAction(shop, s.id); }}>
                <button className="rounded border px-2 py-1 text-sm text-danger" type="submit">Delete</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
