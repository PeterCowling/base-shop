"use client";

import React, { memo, useMemo } from "react";
import type { CSSProperties } from "react";
import type { Page, PageComponent } from "@acme/types";
import type { SectionTemplate } from "@acme/types/section/template";
import PageBuilder from "./page-builder/PageBuilder";

export interface SectionBuilderProps {
  template: SectionTemplate;
  onSave: (fd: FormData) => Promise<unknown>;
  onPublish: (fd: FormData) => Promise<unknown>;
  saving?: boolean;
  publishing?: boolean;
  saveError?: string | null;
  publishError?: string | null;
  style?: CSSProperties;
}

/**
 * SectionBuilder wraps the PageBuilder to edit a single Section template.
 * It maps the SectionTemplate.template (root Section) to a one-page context
 * so we can reuse the editor surface without duplicating the canvas.
 */
const SectionBuilder = memo(function SectionBuilder({
  template,
  onSave,
  onPublish,
  saving,
  publishing,
  saveError,
  publishError,
  style,
}: SectionBuilderProps) {
  // Map SectionTemplate into a minimal Page for the editor
  const page = useMemo<Page>(() => ({
    id: template.id,
    slug: `section-${template.id}`,
    status: template.status,
    components: [template.template as PageComponent],
    seo: { title: {} as any },
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    createdBy: template.createdBy,
  }), [template]);

  const handleSave = async (fd: FormData) => {
    // Extract the current component list from form payload if provided;
    // otherwise rely on PageBuilder to include components via its defaults.
    // Here we ensure the server receives label/status/template fields.
    const form = new FormData();
    form.set("id", template.id);
    form.set("label", template.label);
    form.set("status", template.status);
    // components are included by PageBuilder via `components` key; ensure we map to template
    const comps = fd.get("components");
    if (typeof comps === "string" && comps) {
      try {
        const arr = JSON.parse(comps) as PageComponent[];
        const root = (arr && arr[0]) as PageComponent | undefined;
        if (root) form.set("template", JSON.stringify(root));
      } catch { /* ignore */ }
    }
    return onSave(form);
  };

  const handlePublish = async (fd: FormData) => {
    const form = new FormData();
    form.set("id", template.id);
    form.set("label", template.label);
    form.set("status", "published");
    const comps = fd.get("components");
    if (typeof comps === "string" && comps) {
      try {
        const arr = JSON.parse(comps) as PageComponent[];
        const root = (arr && arr[0]) as PageComponent | undefined;
        if (root) form.set("template", JSON.stringify(root));
      } catch { /* ignore */ }
    }
    return onPublish(form);
  };

  return (
    <PageBuilder
      page={page}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
      publishing={publishing}
      saveError={saveError}
      publishError={publishError}
      style={style}
      mode="section"
    />
  );
});

export default SectionBuilder;
