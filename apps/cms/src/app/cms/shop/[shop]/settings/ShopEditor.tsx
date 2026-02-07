// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";

// Docs: docs/shop-editor-refactor.md

import type { Shop } from "@acme/types";

import EditorSectionsAccordion from "./components/EditorSectionsAccordion";
import { createShopEditorSections } from "./editorSections";
import useShopEditorErrors from "./useShopEditorErrors";
import { useShopEditorForm } from "./useShopEditorForm";

export { default as GeneralSettings } from "./sections/ShopIdentitySection";
export { default as SEOSettings } from "./sections/ShopSeoSection";
export { default as ThemeTokens } from "./sections/ShopThemeSection";

interface Props {
  shop: string;
  initial: Shop;
  initialTrackingProviders: string[];
}

export default function ShopEditor({ shop, initial, initialTrackingProviders }: Props) {
  const form = useShopEditorForm({ shop, initial, initialTrackingProviders });
  const sectionErrors = useShopEditorErrors(form.errors);

  const sections = createShopEditorSections({
    shop,
    info: form.info,
    identity: form.identity,
    providers: form.providers,
    overrides: form.overrides,
    localization: form.localization,
    seo: form.seo,
    errors: sectionErrors,
  });

  return (
    <EditorSectionsAccordion
      sections={sections}
      hiddenFields={[{ name: "id", value: String(form.info.id) }]}
      onSubmit={form.onSubmit}
      saving={form.saving}
    />
  );
}
