import { nowIso } from "@acme/date-utils";
import type { SectionTemplate, PageComponent } from "@acme/types";
import { sectionTemplateSchema } from "@acme/types";
import { ulid } from "ulid";
import { formDataToObject } from "../../utils/formData";
import { ensureAuthorized } from "../common/auth";
import { getSections, saveSection } from "@platform-core/repositories/sections/index.server";
// Load server-side translations within the async action

export async function createSection(
  shop: string,
  formData: FormData,
): Promise<{ section?: SectionTemplate; errors?: Record<string, string[]> }> {
  const { useTranslations: getServerTranslations } = await import(
    "@acme/i18n/useTranslations.server" // i18n-exempt -- INTL-000 module specifier [ttl=2026-03-31]
  );
  const t = await getServerTranslations("en");
  const session = await ensureAuthorized();
  const idField = formData.get("id");
  const raw = formDataToObject(formData) as Record<string, unknown>;

  const id = typeof idField === "string" && idField.trim().length ? idField.trim() : ulid();
  const label = typeof raw.label === "string" && raw.label.trim().length ? raw.label.trim() : t("cms.sections.untitled");
  const status = raw.status === "published" ? "published" : "draft";
  let template: unknown = raw.template;
  if (typeof template === "string" && template) {
    try { template = JSON.parse(template); } catch {}
  }

  const now = nowIso();
  const base: SectionTemplate = {
    id,
    label,
    status,
    template: (template ?? { id: ulid(), type: "Section", children: [] }) as PageComponent,
    createdAt: now,
    updatedAt: now,
    createdBy: session.user.email ?? "unknown",
  };

  const parsed = sectionTemplateSchema.safeParse(base);
  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    return { errors: fieldErrors as Record<string, string[]> };
  }

  const previous = (await getSections(shop)).find((s) => s.id === id);
  const saved = await saveSection(shop, parsed.data, previous);
  return { section: saved };
}
