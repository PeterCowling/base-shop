import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";

import type { XaProduct } from "../lib/xaCatalogModel";

import { XaProductCard } from "./XaProductCard";

function ProductGridSection({ title, items }: { title: string; items: XaProduct[] }) {
  if (!items.length) return null;
  return (
    <Section padding="default">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-6">
        <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
          {items.map((item) => (
            <XaProductCard key={item.slug} product={item} />
          ))}
        </Grid>
      </div>
    </Section>
  );
}

export function XaProductDetailRelated({
  completeLook,
  moreFromDesigner,
  copyCompleteLookLabel,
  copyMoreFromDesigner,
}: {
  completeLook: XaProduct[];
  moreFromDesigner: XaProduct[];
  copyCompleteLookLabel: string;
  copyMoreFromDesigner: string;
}) {
  return (
    <>
      <ProductGridSection title={copyCompleteLookLabel} items={completeLook} />
      <ProductGridSection title={copyMoreFromDesigner} items={moreFromDesigner} />
    </>
  );
}
