import { Section } from "@acme/design-system/atoms/Section";
import { LegalEntityCard } from "@acme/ui/components/organisms/LegalEntityCard";
import { PolicyContent } from "@acme/ui/components/organisms/PolicyContent";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";
import { PolicySection } from "@acme/ui/components/organisms/PolicySection";

import { siteConfig } from "../../../lib/siteConfig";

export default function ReturnPolicyPage() {
  const brandName = siteConfig.brandName;
  const productDescriptor = siteConfig.catalog.productDescriptor;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title="Return policy"
          description={`Returns for ${productDescriptor} purchased from ${brandName} are handled under this policy. This page is a starter template. Replace placeholders with your legal entity details.`}
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
              {siteConfig.showContactInfo && siteConfig.supportEmail ? (
                <div>Support: {siteConfig.supportEmail}</div>
              ) : null}
            </LegalEntityCard>
          ) : null}

          <PolicySection
            title="Refundable vs non-refundable"
            titleClassName="text-lg font-semibold"
          >
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-3 text-start">Situation</th>
                    <th className="p-3 text-start">Outcome</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="p-3">Out of stock after purchase</td>
                    <td className="p-3">Refundable</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Pre-order cancellation</td>
                    <td className="p-3">Non-refundable</td>
                  </tr>
                  <tr>
                    <td className="p-3">Change of mind</td>
                    <td className="p-3">Non-refundable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </PolicySection>

          <PolicySection title="Contact" titleClassName="text-lg font-semibold">
            {siteConfig.showContactInfo ? (
              <p className="text-sm text-muted-foreground">
                {siteConfig.showSocialLinks && siteConfig.whatsappNumber ? (
                  <>WhatsApp: {siteConfig.whatsappNumber} · </>
                ) : null}
                {siteConfig.supportEmail ? `Email: ${siteConfig.supportEmail}` : null}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Contact details are available on request.
              </p>
            )}
          </PolicySection>
        </PolicyContent>
      </Section>
    </main>
  );
}
