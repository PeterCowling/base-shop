import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";

import type { XaProduct } from "../lib/xaCatalogModel";

import { XaProductCard } from "./XaProductCard";

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
      {completeLook.length ? (
        <Section padding="default">
          <h2 className="text-xl font-semibold">{copyCompleteLookLabel}</h2>
          <div className="mt-6">
            <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
              {completeLook.map((item) => (
                <XaProductCard key={item.slug} product={item} />
              ))}
            </Grid>
          </div>
        </Section>
      ) : null}

      {moreFromDesigner.length ? (
        <Section padding="default">
          <h2 className="text-xl font-semibold">{copyMoreFromDesigner}</h2>
          <div className="mt-6">
            <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
              {moreFromDesigner.map((item) => (
                <XaProductCard key={item.slug} product={item} />
              ))}
            </Grid>
          </div>
        </Section>
      ) : null}
    </>
  );
}
