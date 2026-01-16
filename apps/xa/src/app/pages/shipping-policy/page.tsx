/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy shipping policy content pending design/i18n overhaul */
import { Section } from "@ui/atoms/Section";
import { siteConfig } from "../../../lib/siteConfig";

export default function ShippingPolicyPage() {
  const brandName = siteConfig.brandName;
  const productDescriptor = siteConfig.catalog.productDescriptor;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Shipping policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page outlines how {brandName} ships {productDescriptor}. Replace placeholders with your legal
          entity details.
        </p>
      </Section>

      <Section padding="default">
        <div className="space-y-6">
          {siteConfig.showLegalInfo || siteConfig.showContactInfo ? (
            <div className="rounded-lg border p-4 text-sm">
              <div className="font-semibold">Company</div>
              {siteConfig.showLegalInfo && siteConfig.legalEntityName ? (
                <div>{siteConfig.legalEntityName}</div>
              ) : null}
              {siteConfig.showLegalInfo && siteConfig.legalAddress ? (
                <div>{siteConfig.legalAddress}</div>
              ) : null}
              {siteConfig.showLegalInfo && siteConfig.domain ? (
                <div>Domain: {siteConfig.domain}</div>
              ) : null}
              {siteConfig.showContactInfo && siteConfig.supportEmail ? (
                <div>Support: {siteConfig.supportEmail}</div>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Order processing</h2>
            <p className="text-sm text-muted-foreground">
              2–7 business days.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Shipping methods</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Express (DHL): 7–20 business days</li>
              <li>Standard: 12–25 business days</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Notes</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Delivery timelines vary by destination and peak periods.</li>
              <li>Please double-check your address at checkout.</li>
              {siteConfig.showSocialLinks && siteConfig.whatsappNumber ? (
                <li>
                  If you need help, contact us on WhatsApp: {siteConfig.whatsappNumber}
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </Section>
    </main>
  );
}
