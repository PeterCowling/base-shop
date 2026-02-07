/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy product detail content pending design/i18n overhaul */
import { notFound } from "next/navigation";

import { Section } from "@acme/design-system/atoms/Section";
import { Grid } from "@acme/design-system/atoms/Grid";
import { Breadcrumbs } from "@acme/design-system/molecules";
import { Button } from "@acme/design-system/atoms";

import { XaBuyBox } from "../../../components/XaBuyBox.client";
import { XaImageGallery } from "../../../components/XaImageGallery.client";
import { XaProductCard } from "../../../components/XaProductCard";
import { XaSizeGuideDialog } from "../../../components/XaSizeGuideDialog.client";
import { getXaProductByHandle, XA_PRODUCTS } from "../../../lib/demoData";
import { siteConfig } from "../../../lib/siteConfig";
import { toWhatsappHref } from "../../../lib/support";
import { formatLabel, getDesignerName } from "../../../lib/xaCatalog";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = getXaProductByHandle(handle);
  if (!product) notFound();

  const designerName = getDesignerName(product.brand);
  const categoryLabel = formatLabel(product.taxonomy.subcategory);
  const categoryHref = `/${product.taxonomy.department}/${product.taxonomy.category}/${product.taxonomy.subcategory}`;
  const canonicalUrl = siteConfig.domain
    ? `https://${siteConfig.domain}/products/${product.slug}`
    : "";
  const primaryImage = product.media.find((m) => m.type === "image")?.url;
  const showSocialLinks = siteConfig.showSocialLinks;
  const showContactInfo = siteConfig.showContactInfo;
  const showShare = Boolean(canonicalUrl) && !siteConfig.stealthMode;
  const whatsappHref = showSocialLinks
    ? toWhatsappHref(siteConfig.whatsappNumber)
    : null;

  const isClothing = product.taxonomy.category === "clothing";
  const isBags = product.taxonomy.category === "bags";
  const isJewelry = product.taxonomy.category === "jewelry";

  const completeLook = XA_PRODUCTS.filter(
    (item) =>
      item.slug !== product.slug &&
      item.taxonomy.department === product.taxonomy.department &&
      item.taxonomy.category !== product.taxonomy.category,
  ).slice(0, 4);

  const moreFromDesigner = XA_PRODUCTS.filter(
    (item) => item.slug !== product.slug && item.brand === product.brand,
  ).slice(0, 4);

  return (
    <main className="sf-content xa-pdp">
      <Section padding="wide">
        <div className="grid gap-16 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)]">
          <div className="space-y-6">
            <XaImageGallery title={product.title} media={product.media} />
            <Breadcrumbs
              className="xa-pdp-breadcrumbs text-muted-foreground"
              items={[
                { label: "Home", href: "/" },
                { label: designerName, href: `/designer/${product.brand}` },
                { label: categoryLabel, href: categoryHref },
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
                    <div className="text-sm font-semibold">Size & fit</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {product.details?.modelHeight ? (
                        <div>Model is {product.details.modelHeight}.</div>
                      ) : null}
                      {product.details?.modelSize ? (
                        <div>Wears size {product.details.modelSize}.</div>
                      ) : null}
                      {product.details?.fitNote ? <div>{product.details.fitNote}</div> : null}
                    </div>
                    <div className="pt-2">
                      <XaSizeGuideDialog
                        copy={
                          product.details?.sizeGuide ??
                          "Standard sizing. Compare against your best-fitting garment."
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Fabric & care</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {product.details?.fabricFeel ? (
                        <div>{product.details.fabricFeel}</div>
                      ) : null}
                      {product.details?.care ? <div>{product.details.care}</div> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {isBags ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Bag details</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {product.details?.dimensions ? (
                        <div>Dimensions: {product.details.dimensions}</div>
                      ) : null}
                      {product.details?.strapDrop ? (
                        <div>Strap drop: {product.details.strapDrop}</div>
                      ) : null}
                    </div>
                  </div>

                  {product.details?.whatFits?.length ? (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">What fits</div>
                      <div className="text-sm text-muted-foreground">
                        {product.details.whatFits.map(formatLabel).join(" / ")}
                      </div>
                    </div>
                  ) : null}

                  {product.details?.interior?.length ? (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Interior</div>
                      <div className="text-sm text-muted-foreground">
                        {product.details.interior.map(formatLabel).join(" / ")}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {isJewelry ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Materials & size</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {product.taxonomy.metal ? (
                        <div>Metal: {formatLabel(product.taxonomy.metal)}</div>
                      ) : null}
                      {product.taxonomy.gemstone && product.taxonomy.gemstone !== "none" ? (
                        <div>Stone: {formatLabel(product.taxonomy.gemstone)}</div>
                      ) : null}
                      {product.taxonomy.jewelrySize ? (
                        <div>Size: {formatLabel(product.taxonomy.jewelrySize)}</div>
                      ) : null}
                      {product.details?.sizeGuide ? (
                        <div>Sizing guidance: {product.details.sizeGuide}</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Care & warranty</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {product.details?.care ? <div>{product.details.care}</div> : null}
                      {product.details?.warranty ? <div>{product.details.warranty}</div> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {showShare ? (
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Share</div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Facebook
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(product.title)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Twitter
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(canonicalUrl)}&media=${encodeURIComponent(primaryImage ?? canonicalUrl)}&description=${encodeURIComponent(product.title)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Pinterest
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        LinkedIn
                      </a>
                    </Button>
                    {showSocialLinks ? (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${product.title} - ${canonicalUrl}`)}`}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          WhatsApp
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {showContactInfo || showSocialLinks ? (
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Contact</div>
                  <div className="flex flex-wrap gap-3">
                    {whatsappHref ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={whatsappHref} target="_blank" rel="noreferrer noopener">
                          WhatsApp
                        </a>
                      </Button>
                    ) : null}
                    {showContactInfo && siteConfig.supportEmail ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`mailto:${siteConfig.supportEmail}`}>Email</a>
                      </Button>
                    ) : null}
                    {showSocialLinks && siteConfig.instagramUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={siteConfig.instagramUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          Instagram
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  {showContactInfo && (siteConfig.wechatId || siteConfig.businessHours) ? (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {siteConfig.wechatId ? <div>WeChat: {siteConfig.wechatId}</div> : null}
                      {siteConfig.businessHours ? (
                        <div>Business hours: {siteConfig.businessHours}</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-8 self-start md:sticky md:top-28 md:max-w-[360px] md:justify-self-end">
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
          <h2 className="text-xl font-semibold">Complete the look</h2>
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
          <h2 className="text-xl font-semibold">More from {designerName}</h2>
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
