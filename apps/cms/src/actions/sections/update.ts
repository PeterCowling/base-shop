import { nowIso } from "@acme/date-utils";
import type { SectionTemplate, PageComponent } from "@acme/types";
import { sectionTemplateSchema } from "@acme/types";
import { formDataToObject } from "../../utils/formData";
import { ensureAuthorized } from "../common/auth";
import { getSections, updateSection } from "@platform-core/repositories/sections/index.server";

export async function updateSectionAction(
  shop: string,
  formData: FormData,
): Promise<{ section?: SectionTemplate; errors?: Record<string, string[]> }> {
  const session = await ensureAuthorized();
  const raw = formDataToObject(formData) as Record<string, unknown>;
  const id = typeof raw.id === "string" && raw.id.trim().length ? raw.id.trim() : "";
  if (!id) return { errors: { id: ["Missing id"] } };

  const previous = (await getSections(shop)).find((s) => s.id === id);
  if (!previous) return { errors: { id: ["Unknown id"] } };

  const label = typeof raw.label === "string" && raw.label.trim().length ? raw.label.trim() : previous.label;
  const status = raw.status === "published" || raw.status === "draft" ? (raw.status as "draft" | "published") : previous.status;
  let template: unknown = raw.template ?? previous.template;
  if (typeof template === "string" && template) {
    try { template = JSON.parse(template); } catch {}
  }

  const patch: SectionTemplate = {
    ...previous,
    label,
    status,
    template: template as PageComponent,
    updatedAt: nowIso(),
    createdBy: previous.createdBy || (session.user.email ?? "unknown"),
  };

  const parsed = sectionTemplateSchema.safeParse(patch);
  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    return { errors: fieldErrors as Record<string, string[]> };
  }

  const saved = await updateSection(
    shop,
    { ...parsed.data, updatedAt: previous.updatedAt },
    previous,
  );
  return { section: saved };
}
