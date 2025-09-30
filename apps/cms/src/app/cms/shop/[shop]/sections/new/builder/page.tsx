// apps/cms/src/app/cms/shop/[shop]/sections/new/builder/page.tsx

import dynamic from "next/dynamic";
import { ulid } from "ulid";
import { nowIso } from "@acme/date-utils";
import type SectionBuilderComponent from "@ui/components/cms/SectionBuilder";
import type { SectionTemplate, PageComponent } from "@acme/types";
import { createSection } from "@cms/actions/sections/create";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";

type SectionBuilderProps = React.ComponentProps<typeof SectionBuilderComponent>;
const SectionBuilder = dynamic<SectionBuilderProps>(() => import("@ui/components/cms/SectionBuilder")); // i18n-exempt -- CMS-0001 module path string; non-UI [ttl=2026-12-31]
void SectionBuilder;

export const revalidate = 0;

export default async function NewSectionBuilderRoute({ params }: { params: Promise<{ shop: string }> }) {
  const { shop } = await params;
  const t = await getTranslations("en");
  const now = nowIso();
  const blank: SectionTemplate = {
    id: ulid(),
    label: String(t("cms.sections.new.untitledLabel")),
    status: "draft",
    template: { id: ulid(), type: "Section", children: [] } as PageComponent,
    createdAt: now,
    updatedAt: now,
    createdBy: "",
  };

  async function save(formData: FormData) {
    "use server";
    return createSection(shop, formData);
  }

  async function publish(formData: FormData) {
    "use server";
    formData.set("status", "published");
    return createSection(shop, formData);
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">{t("cms.sections.new.title", { shop })}</h1>
      <SectionBuilder template={blank} onSave={save} onPublish={publish} />
    </>
  );
}
