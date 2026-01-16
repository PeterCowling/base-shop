// apps/cms/src/app/cms/shop/[shop]/sections/history/page.tsx
import "server-only";
import { requirePermission } from "@acme/auth";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { listSectionHistory } from "@acme/platform-core/repositories/sections/sections.json.server";
import type { SectionTemplate } from "@acme/types";
import Section from "@acme/ui/components/cms/blocks/Section";

export const dynamic = "force-dynamic";

type SectionHistoryEvent = {
  type: string;
  id?: string;
  before?: SectionTemplate | null;
  after?: SectionTemplate | null;
  at?: string;
  detectedAt?: string;
};

export default async function SectionsHistoryPage({ params }: { params: { shop: string } }) {
  await requirePermission("manage_pages");
  const { shop } = params;
  const history = await listSectionHistory(shop);
  const items: SectionHistoryEvent[] = Array.isArray(history)
    ? (history as SectionHistoryEvent[])
    : [];
  const t = await getTranslations("en");

  return (
    <Section contentWidth="normal">
      <div className="p-6">
        <h1 className="mb-4 text-xl font-semibold">{t("cms.sections.history.title")}</h1>
        {items.length === 0 && (
          <p className="text-sm text-neutral-600">{t("cms.sections.history.empty")}</p>
        )}
        <ul className="space-y-3">
          {items.map((e: SectionHistoryEvent, idx: number) => (
            <li key={idx} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-700">
                  <div><span className="font-medium">{t("cms.sections.history.type")}</span> {String(e.type)}</div>
                  <div><span className="font-medium">{t("cms.sections.history.sectionId")}</span> {String(e.id ?? e.after?.id ?? e.before?.id ?? "-")}</div>
                  <div><span className="font-medium">{t("cms.sections.history.at")}</span> {String(e.at ?? e.detectedAt ?? "-")}</div>
                </div>
                {e.after && (
                  <form
                    action={`/api/sections/${encodeURIComponent(shop)}/restore`}
                    method="post"
                    className="ms-4"
                  >
                    <input type="hidden" name="snapshot" value={JSON.stringify(e.after as SectionTemplate)} />
                    <button type="submit" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border bg-white px-3 text-sm hover:bg-neutral-50">{t("cms.sections.history.restore")}</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
