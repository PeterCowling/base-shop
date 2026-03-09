import { Button } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives/Inline";

import { siteConfig } from "../lib/siteConfig";
import type { useProductDetailData } from "../lib/useProductDetailData";

type ShareCopy = Pick<
  ReturnType<typeof useProductDetailData>["copy"],
  | "share"
  | "contact"
  | "facebook"
  | "twitter"
  | "pinterest"
  | "linkedIn"
  | "whatsapp"
  | "email"
  | "instagram"
  | "wechat"
  | "businessHoursPrefix"
>;

export function XaProductDetailShare({
  showShare,
  showSocialLinks,
  showContactInfo,
  canonicalUrl,
  primaryImage,
  productTitle,
  whatsappHref,
  copy,
}: {
  showShare: boolean;
  showSocialLinks: boolean;
  showContactInfo: boolean;
  canonicalUrl: string;
  primaryImage: string | undefined;
  productTitle: string;
  whatsappHref: string | null;
  copy: ShareCopy;
}) {
  return (
    <>
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
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(productTitle)}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                {copy.twitter}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(canonicalUrl)}&media=${encodeURIComponent(primaryImage ?? canonicalUrl)}&description=${encodeURIComponent(productTitle)}`}
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
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${productTitle} - ${canonicalUrl}`)}`}
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
                <div>{copy.businessHoursPrefix}{siteConfig.businessHours}</div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
