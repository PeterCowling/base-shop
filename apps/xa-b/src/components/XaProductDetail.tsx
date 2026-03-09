import { Button } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";
import { Breadcrumbs } from "@acme/design-system/molecules";
import { Inline } from "@acme/design-system/primitives/Inline";

import { siteConfig } from "../lib/siteConfig";
import { toWhatsappHref } from "../lib/support";
import {
  formatLabel,
  formatLabelList,
  getDepartmentCategoryHref,
  getDepartmentCategorySubcategoryHref,
  getDesignerName,
  isProductImage,
} from "../lib/xaCatalog";
import type { XaProduct } from "../lib/xaCatalogModel";
import { xaI18n } from "../lib/xaI18n";
import { getDesignerHref, getProductHref } from "../lib/xaRoutes";

import { XaBuyBox } from "./XaBuyBox.client";
import { XaImageGallery } from "./XaImageGallery.client";
import { XaProductCard } from "./XaProductCard";
import { XaSizeGuideDialog } from "./XaSizeGuideDialog.client";

export function XaProductDetail({
  product,
  products,
}: {
  product: XaProduct;
  products: XaProduct[];
}) {
  const designerName = getDesignerName(product.brand);
  const categoryLabel = formatLabel(product.taxonomy.category);
  const categoryHref = getDepartmentCategoryHref(
    product.taxonomy.department,
    product.taxonomy.category,
  );
  const subcategoryLabel = formatLabel(product.taxonomy.subcategory);
  const subcategoryHref = getDepartmentCategorySubcategoryHref(
    product.taxonomy.department,
    product.taxonomy.category,
    product.taxonomy.subcategory,
  );
  const canonicalUrl = siteConfig.domain
    ? `https://${siteConfig.domain}${getProductHref(product.slug)}`
    : "";
  const primaryImage = product.media.find(isProductImage)?.url;
  const showSocialLinks = siteConfig.showSocialLinks;
  const showContactInfo = siteConfig.showContactInfo;
  const showShare = Boolean(canonicalUrl) && !siteConfig.stealthMode;
  const whatsappHref = showSocialLinks
    ? toWhatsappHref(siteConfig.whatsappNumber)
    : null;

  const isClothing = product.taxonomy.category === "clothing";
  const isBags = product.taxonomy.category === "bags";
  const isJewelry = product.taxonomy.category === "jewelry";
  const copy = {
    home: xaI18n.t("xaB.src.app.products.handle.page.copy.home"),
    sizeFit: xaI18n.t("xaB.src.app.products.handle.page.copy.sizeFit"),
    modelIs: xaI18n.t("xaB.src.app.products.handle.page.copy.modelIs", {
      height: product.details?.modelHeight ?? "",
    }),
    wearsSize: xaI18n.t("xaB.src.app.products.handle.page.copy.wearsSize", {
      size: product.details?.modelSize ?? "",
    }),
    sizeGuideFallback: xaI18n.t("xaB.src.app.products.handle.page.copy.sizeGuideFallback"),
    bagDetails: xaI18n.t("xaB.src.app.products.handle.page.copy.bagDetails"),
    dimensions: xaI18n.t("xaB.src.app.products.handle.page.copy.dimensions", {
      value: product.details?.dimensions ?? "",
    }),
    strapDrop: xaI18n.t("xaB.src.app.products.handle.page.copy.strapDrop", {
      value: product.details?.strapDrop ?? "",
    }),
    whatFits: xaI18n.t("xaB.src.app.products.handle.page.copy.whatFits"),
    interior: xaI18n.t("xaB.src.app.products.handle.page.copy.interior"),
    metal: xaI18n.t("xaB.src.app.products.handle.page.copy.metal"),
    stone: xaI18n.t("xaB.src.app.products.handle.page.copy.stone"),
    size: xaI18n.t("xaB.src.app.products.handle.page.copy.size"),
    share: xaI18n.t("xaB.src.app.products.handle.page.copy.share"),
    contact: xaI18n.t("xaB.src.app.products.handle.page.copy.contact"),
    facebook: xaI18n.t("xaB.src.app.products.handle.page.copy.facebook"),
    twitter: xaI18n.t("xaB.src.app.products.handle.page.copy.twitter"),
    pinterest: xaI18n.t("xaB.src.app.products.handle.page.copy.pinterest"),
    linkedIn: xaI18n.t("xaB.src.app.products.handle.page.copy.linkedIn"),
    whatsapp: xaI18n.t("xaB.src.app.products.handle.page.copy.whatsapp"),
    email: xaI18n.t("xaB.src.app.products.handle.page.copy.email"),
    instagram: xaI18n.t("xaB.src.app.products.handle.page.copy.instagram"),
    wechat: xaI18n.t("xaB.src.app.products.handle.page.copy.wechat"),
    moreFromDesigner: xaI18n.t("xaB.src.app.products.handle.page.copy.moreFromDesigner", {
      designerName,
    }),
  };

  const completeLook = products.filter(
    (item) =>
      item.slug !== product.slug &&
      item.taxonomy.department === product.taxonomy.department &&
      item.taxonomy.category !== product.taxonomy.category,
  ).slice(0, 4);

  const moreFromDesigner = products.filter(
    (item) => item.slug !== product.slug && item.brand === product.brand,
  ).slice(0, 4);

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
              {isClothing ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">{copy.sizeFit}</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {product.details?.modelHeight ? <div>{copy.modelIs}</div> : null}
                      {product.details?.modelSize ? <div>{copy.wearsSize}</div> : null}
                      {product.details?.fitNote ? <div>{product.details.fitNote}</div> : null}
                    </div>
                    <div className="pt-2">
                      <XaSizeGuideDialog copy={product.details?.sizeGuide ?? copy.sizeGuideFallback} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold">{xaI18n.t("xaB.src.app.products.handle.page.l103c60")}</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {product.details?.fabricFeel ? <div>{product.details.fabricFeel}</div> : null}
                      {product.details?.care ? <div>{product.details.care}</div> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {isBags ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">{copy.bagDetails}</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {product.details?.dimensions ? <div>{copy.dimensions}</div> : null}
                      {product.details?.strapDrop ? <div>{copy.strapDrop}</div> : null}
                    </div>
                  </div>

                  {product.details?.whatFits?.length ? (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">{copy.whatFits}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatLabelList(product.details.whatFits)}
                      </div>
                    </div>
                  ) : null}

                  {product.details?.interior?.length ? (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">{copy.interior}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatLabelList(product.details.interior)}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {isJewelry ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">{xaI18n.t("xaB.src.app.products.handle.page.l151c60")}</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {product.taxonomy.metal ? (
                        <div>{copy.metal}: {formatLabel(product.taxonomy.metal)}</div>
                      ) : null}
                      {product.taxonomy.gemstone && product.taxonomy.gemstone !== "none" ? (
                        <div>{copy.stone}: {formatLabel(product.taxonomy.gemstone)}</div>
                      ) : null}
                      {product.taxonomy.jewelrySize ? (
                        <div>{copy.size}: {formatLabel(product.taxonomy.jewelrySize)}</div>
                      ) : null}
                      {product.details?.sizeGuide ? (
                        <div>{xaI18n.t("xaB.src.app.products.handle.page.l163c30")}{product.details.sizeGuide}</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold">{xaI18n.t("xaB.src.app.products.handle.page.l169c60")}</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {product.details?.care ? <div>{product.details.care}</div> : null}
                      {product.details?.warranty ? <div>{product.details.warranty}</div> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {showShare ? (
                <div className="space-y-3">
                  <div className="text-sm font-semibold">{copy.share}</div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {copy.facebook}
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(product.title)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {copy.twitter}
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(canonicalUrl)}&media=${encodeURIComponent(primaryImage ?? canonicalUrl)}&description=${encodeURIComponent(product.title)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {copy.pinterest}
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {copy.linkedIn}
                      </a>
                    </Button>
                    {showSocialLinks ? (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${product.title} - ${canonicalUrl}`)}`}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {copy.whatsapp}
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {showContactInfo || showSocialLinks ? (
                <div className="space-y-3">
                  <div className="text-sm font-semibold">{copy.contact}</div>
                  <Inline gap={3} className="flex-wrap">
                    {whatsappHref ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={whatsappHref} target="_blank" rel="noreferrer noopener">
                          {copy.whatsapp}
                        </a>
                      </Button>
                    ) : null}
                    {showContactInfo && siteConfig.supportEmail ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`mailto:${siteConfig.supportEmail}`}>{copy.email}</a>
                      </Button>
                    ) : null}
                    {showSocialLinks && siteConfig.instagramUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={siteConfig.instagramUrl} target="_blank" rel="noreferrer noopener">
                          {copy.instagram}
                        </a>
                      </Button>
                    ) : null}
                  </Inline>
                  {showContactInfo && (siteConfig.wechatId || siteConfig.businessHours) ? (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {siteConfig.wechatId ? <div>{copy.wechat}: {siteConfig.wechatId}</div> : null}
                      {siteConfig.businessHours ? (
                        <div>{xaI18n.t("xaB.src.app.products.handle.page.l265c30")}{siteConfig.businessHours}</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
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

      {completeLook.length ? (
        <Section padding="default">
          <h2 className="text-xl font-semibold">{xaI18n.t("xaB.src.app.products.handle.page.l287c49")}</h2>
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
          <h2 className="text-xl font-semibold">{copy.moreFromDesigner}</h2>
          <div className="mt-6">
            <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
              {moreFromDesigner.map((item) => (
                <XaProductCard key={item.slug} product={item} />
              ))}
            </Grid>
          </div>
        </Section>
      ) : null}
    </main>
  );
}
