import { Section } from "@acme/design-system/atoms/Section";
import { Breadcrumbs } from "@acme/design-system/molecules";

import { useProductDetailData } from "../lib/useProductDetailData";
import type { XaProduct } from "../lib/xaCatalogModel";
import { getDesignerHref } from "../lib/xaRoutes";

import { XaBuyBox } from "./XaBuyBox.client";
import { XaImageGallery } from "./XaImageGallery.client";
import { XaProductDetailRelated } from "./XaProductDetailRelated";
import { XaProductDetailSections } from "./XaProductDetailSections";
import { XaProductDetailShare } from "./XaProductDetailShare";

export function XaProductDetail({
  product,
  products,
}: {
  product: XaProduct;
  products: XaProduct[];
}) {
  const {
    designerName,
    categoryLabel,
    categoryHref,
    subcategoryLabel,
    subcategoryHref,
    canonicalUrl,
    primaryImage,
    showSocialLinks,
    showContactInfo,
    showShare,
    whatsappHref,
    copy,
    completeLook,
    moreFromDesigner,
  } = useProductDetailData(product, products);

  return (
    <main className="sf-content xa-pdp">
      <Section padding="wide">
        <div className="xa-grid-pdp-primary">
          <div className="space-y-6">
            <XaImageGallery title={product.title} media={product.media} />
            <Breadcrumbs
              className="xa-pdp-breadcrumbs text-muted-foreground"
              items={[
                { label: copy.home, href: "/" },
                { label: designerName, href: getDesignerHref(product.brand) },
                { label: categoryLabel, href: categoryHref },
                { label: subcategoryLabel, href: subcategoryHref ?? undefined },
                { label: product.title },
              ]}
            />

            {product.description ? (
              <div className="xa-pdp-description text-muted-foreground">
                {product.description}
              </div>
            ) : null}

            <div className="space-y-8 pt-2">
              <XaProductDetailSections
                product={product}
                category={product.taxonomy.category}
                copy={copy}
              />
              <XaProductDetailShare
                showShare={showShare}
                showSocialLinks={showSocialLinks}
                showContactInfo={showContactInfo}
                canonicalUrl={canonicalUrl}
                primaryImage={primaryImage}
                productTitle={product.title}
                whatsappHref={whatsappHref}
                copy={copy}
              />
            </div>
          </div>

          <div className="space-y-8 self-start md:sticky md:top-28 xa-pdp-sidebar-max md:justify-self-end">
            <div className="space-y-1">
              <div className="xa-pdp-brand">{designerName}</div>
              <div className="xa-pdp-title text-muted-foreground">{product.title}</div>
            </div>

            <XaBuyBox product={product} />
          </div>
        </div>
      </Section>

      <XaProductDetailRelated
        completeLook={completeLook}
        moreFromDesigner={moreFromDesigner}
        copyCompleteLookLabel={copy.completeLookLabel}
        copyMoreFromDesigner={copy.moreFromDesigner}
      />
    </main>
  );
}
