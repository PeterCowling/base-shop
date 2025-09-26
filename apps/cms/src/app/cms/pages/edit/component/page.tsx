// apps/cms/src/app/cms/pages/edit/component/page.tsx

import type { Page, PageComponent } from "@acme/types";
import PageBuilderClient from "./PageBuilderClient";
import { saveLibraryItem, type LibraryItem } from "@cms/actions/library.server";

export const dynamic = "force-dynamic";

export default async function EditComponentGlobalRoute() {
  const blank = {
    id: "",
    slug: "",
    status: "draft",
    components: [],
    seo: {
      title: { default: "" },
      description: { default: "" },
      image: { default: "" },
      brand: { default: "" },
      offers: { default: "" },
      aggregateRating: { default: "" },
    },
    createdAt: "",
    updatedAt: "",
    createdBy: "",
  } as Page;

  async function saveToGlobal(formData: FormData) {
    "use server";
    try {
      const raw = formData.get("components");
      const parsed = raw ? (JSON.parse(String(raw)) as PageComponent[]) : [];
      const draftId = "global-edit-draft";
      const label = `Global Draft`;
      const item: LibraryItem = parsed.length === 1
        ? { id: draftId, label, template: parsed[0], createdAt: Date.now(), shared: true }
        : { id: draftId, label, templates: parsed, createdAt: Date.now(), shared: true } as LibraryItem;
      await saveLibraryItem("_global", item);
      return { ok: true, updatedAt: new Date().toISOString() };
    } catch (err) {
      return { ok: false, error: (err as Error)?.message ?? "save failed" };
    }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Edit Component – CMS</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Experiment with component editing globally. Saving/publishing is disabled here.
      </p>
      <PageBuilderClient
        page={blank}
        onSave={saveToGlobal}
        onPublish={saveToGlobal}
        mode="section"
      />
    </>
  );
}
