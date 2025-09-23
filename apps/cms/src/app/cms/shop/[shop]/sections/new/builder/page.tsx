// apps/cms/src/app/cms/shop/[shop]/sections/new/builder/page.tsx

import dynamic from "next/dynamic";
import { ulid } from "ulid";
import { nowIso } from "@acme/date-utils";
import type SectionBuilderComponent from "@ui/components/cms/SectionBuilder";
import type { SectionTemplate } from "@acme/types";
import { createSection } from "@cms/actions/sections/create";

type SectionBuilderProps = React.ComponentProps<typeof SectionBuilderComponent>;
const SectionBuilder = dynamic<SectionBuilderProps>(() => import("@ui/components/cms/SectionBuilder"));
void SectionBuilder;

export const revalidate = 0;

export default async function NewSectionBuilderRoute({ params }: { params: Promise<{ shop: string }> }) {
  const { shop } = await params;
  const now = nowIso();
  const blank: SectionTemplate = {
    id: ulid(),
    label: "Untitled Section",
    status: "draft",
    template: { id: ulid(), type: "Section", children: [] } as any,
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
      <h1 className="mb-6 text-2xl font-semibold">New section - {shop}</h1>
      <SectionBuilder template={blank} onSave={save} onPublish={publish} />
    </>
  );
}
