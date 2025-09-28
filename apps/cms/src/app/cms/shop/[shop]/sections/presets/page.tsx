import "server-only";
import { requirePermission } from "@auth";
import { listPresets } from "@acme/platform-core/repositories/sections/presets.server";
// Note: no need for SectionPreset type import here
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { TranslationsProvider } from "@i18n/Translations";
import en from "@i18n/en.json";

export const dynamic = "force-dynamic";

export default async function PresetsAdminPage({ params }: { params: { shop: string } }) {
  await requirePermission("manage_pages");
  const { shop } = params;
  const presets = await listPresets(shop);
  const t = await getTranslations("en");

  return (
    <TranslationsProvider messages={en}>
      <div className="mx-auto p-6 space-y-6">
        <h1 className="text-xl font-semibold">{t("cms.sectionPresets.title")}</h1>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">{t("cms.sectionPresets.create.title")}</h2>
          <form action={`/api/sections/${encodeURIComponent(shop)}/presets`} method="post" className="space-y-2">
            <input type="hidden" name="__json" value="1" />
            <div>
              <label className="block text-sm">{t("cms.sectionPresets.label")}</label>
              <input name="label" required className="w-full rounded border p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm">{t("cms.sectionPresets.locked.label")}</label>
              <input name="locked" className="w-full rounded border p-2 text-sm" placeholder={t("cms.sectionPresets.locked.placeholder") as string} />
            </div>
            <div>
              <label className="block text-sm">{t("cms.sectionPresets.template.label")}</label>
              <textarea name="template" required rows={8} className="w-full rounded border p-2 font-mono text-xs" placeholder={t("cms.sectionPresets.template.placeholder") as string} />
            </div>
            <button type="submit" className="rounded border bg-white px-3 py-1 text-sm hover:bg-neutral-50 min-h-11 min-w-11">{t("cms.sectionPresets.save")}</button>
          </form>
          <p className="text-xs text-neutral-600">{t("cms.sectionPresets.help")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">{t("cms.sectionPresets.existing.title")}</h2>
          {presets.length === 0 ? (
            <p className="text-sm text-neutral-600">{t("cms.sectionPresets.existing.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {presets.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <div className="font-medium">{p.label}</div>
                    {Array.isArray(p.locked) && p.locked.length > 0 && (
                      <div className="text-xs text-neutral-600">{t("cms.sectionPresets.lockedPrefix")} {p.locked.join(", ")}</div>
                    )}
                  </div>
                  <form
                    action={`/api/sections/${encodeURIComponent(shop)}/presets?id=${encodeURIComponent(p.id)}`}
                    method="post"
                    onSubmit={(e) => {
                      const methodInput = e.currentTarget.elements.namedItem("_method") as HTMLInputElement | null;
                      if (methodInput) methodInput.value = "DELETE";
                    }}
                  >
                    <input type="hidden" name="_method" value="DELETE" />
                    <button type="submit" className="rounded border px-3 py-1 text-sm hover:bg-neutral-50 min-h-11 min-w-11">{t("cms.delete")}</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </TranslationsProvider>
  );
}
