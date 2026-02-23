import { Section } from "@acme/design-system/atoms/Section";
import { LegalEntityCard } from "@acme/ui/components/organisms/LegalEntityCard";
import { PolicyContent } from "@acme/ui/components/organisms/PolicyContent";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";
import { PolicySection } from "@acme/ui/components/organisms/PolicySection";

import { siteConfig } from "../../../lib/siteConfig";

export default function ShippingPolicyPage() {
  const brandName = siteConfig.brandName;
  const productDescriptor = siteConfig.catalog.productDescriptor;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title="Shipping policy"
          description={`This page outlines how ${brandName} ships ${productDescriptor}. Replace placeholders with your legal entity details.`}
          descriptionClassName="mt-2 text-sm text-muted-foreground max-w-none"
        />
      </Section>

      <Section padding="default">
        <PolicyContent className="space-y-6">
          {siteConfig.showLegalInfo || siteConfig.showContactInfo ? (
            <LegalEntityCard
              title="Company"
              className="rounded-lg border p-4 text-sm"
              titleClassName="font-semibold text-inherit"
              bodyClassName="space-y-0"
            >
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
            </LegalEntityCard>
          ) : null}

          <PolicySection title="Order processing" titleClassName="text-lg font-semibold">
            <p className="text-sm text-muted-foreground">
              2–7 business days.
            </p>
          </PolicySection>

          <PolicySection title="Shipping methods" titleClassName="text-lg font-semibold">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Express (DHL): 7–20 business days</li>
              <li>Standard: 12–25 business days</li>
            </ul>
          </PolicySection>

          <PolicySection title="Notes" titleClassName="text-lg font-semibold">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Delivery timelines vary by destination and peak periods.</li>
              <li>Please double-check your address at checkout.</li>
              {siteConfig.showSocialLinks && siteConfig.whatsappNumber ? (
                <li>
                  If you need help, contact us on WhatsApp: {siteConfig.whatsappNumber}
                </li>
              ) : null}
            </ul>
          </PolicySection>
        </PolicyContent>
      </Section>
    </main>
  );
}
