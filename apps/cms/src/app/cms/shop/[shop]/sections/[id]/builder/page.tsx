// apps/cms/src/app/cms/shop/[shop]/sections/[id]/builder/page.tsx

import dynamic from "next/dynamic";
import type SectionBuilderComponent from "@acme/ui/components/cms/SectionBuilder";
import type { SectionTemplate } from "@acme/types";
import { getSections } from "@acme/platform-core/repositories/sections/index.server";
import { updateSectionAction } from "@cms/actions/sections/update";

type SectionBuilderProps = React.ComponentProps<typeof SectionBuilderComponent>;
const SectionBuilder = dynamic<SectionBuilderProps>(() => import("@acme/ui/components/cms/SectionBuilder"));
void SectionBuilder;

export const revalidate = 0;

export default async function SectionBuilderRoute({ params }: { params: Promise<{ shop: string; id: string }> }) {
  const { shop, id } = await params;
  const list = await getSections(shop);
  const section = list.find((s) => s.id === id);
  if (!section) return <div className="text-sm text-danger">Section not found</div>;

  async function save(formData: FormData) {
    "use server";
    return updateSectionAction(shop, formData);
  }

  async function publish(formData: FormData) {
    "use server";
    formData.set("status", "published");
    return updateSectionAction(shop, formData);
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Edit section - {section.label}</h1>
      <SectionBuilder template={section as SectionTemplate} onSave={save} onPublish={publish} />
    </>
  );
}
