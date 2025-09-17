// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx

"use client";

import { Accordion, Button, Input } from "@ui";
import type { Shop } from "@acme/types";
import IdentitySection from "./sections/IdentitySection";
import LocalizationSection from "./sections/LocalizationSection";
import ProvidersSection from "./sections/ProvidersSection";
import OverridesSection from "./sections/OverridesSection";
import { useShopEditorForm } from "./useShopEditorForm";

interface Props {
  shop: string;
  initial: Shop;
  initialTrackingProviders: string[];
}

export default function ShopEditor({ shop, initial, initialTrackingProviders }: Props) {
  const { identity, localization, providers, overrides, form } = useShopEditorForm({
    shop,
    initial,
    initialTrackingProviders,
  });

  const accordionItems = [
    {
      title: "Identity",
      content: <IdentitySection {...identity} />,
    },
    {
      title: "Localization",
      content: <LocalizationSection {...localization} />,
    },
    {
      title: "Providers",
      content: <ProvidersSection {...providers} />,
    },
    {
      title: "Overrides",
      content: <OverridesSection {...overrides} />,
    },
  ];

  return (
    <form onSubmit={form.onSubmit} className="space-y-4">
      <Input type="hidden" name="id" value={form.id} />
      <Accordion items={accordionItems} />
      <Button disabled={form.saving} type="submit">
        {form.saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

