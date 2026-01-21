// apps/cms/src/app/cms/shop/[shop]/sections/page.tsx

import Link from "next/link";

import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { getSections } from "@acme/platform-core/repositories/sections/index.server";

import { deleteSectionAction } from "@/actions/sections/delete";
import { updateSectionAction } from "@/actions/sections/update";

export const revalidate = 0;

export default async function SectionsListRoute({ params }: { params: Promise<{ shop: string }> }) {
  const { shop } = await params;
  const sections = await getSections(shop);
  const t = await getTranslations("en");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("cms.sections.list.title", { shop })}</h1>
        <Link className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-3 text-sm" href={`/cms/shop/${shop}/sections/new/builder`}>
          {t("cms.sections.list.create")}
        </Link>
      </div>
      <ul className="divide-y rounded border">
        {sections.length === 0 && <li className="p-3 text-sm text-muted-foreground">{t("cms.sections.list.empty")}</li>}
        {sections.map((s) => (
          <li key={s.id} className="flex items-center justify-between p-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.status} • {new Date(s.updatedAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <Link className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-3 text-sm" href={`/cms/shop/${shop}/sections/${s.id}/builder`}>
                {t("cms.sections.list.edit")}
              </Link>
              <form action={async () => { "use server"; const fd = new FormData(); fd.set('id', s.id); fd.set('status', s.status === "published" ? "draft" : "published"); await updateSectionAction(shop, fd); }}>
                <button className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-3 text-sm" type="submit">
                  {s.status === "published" ? t("cms.sections.list.unpublish") : t("cms.sections.list.publish")}
                </button>
              </form>
              <form action={async () => { "use server"; await deleteSectionAction(shop, s.id); }}>
                <button className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-3 text-sm text-danger" type="submit">{t("cms.sections.list.delete")}</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
