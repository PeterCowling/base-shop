import { Section } from "@acme/design-system/atoms/Section";
import { LegalEntityCard } from "@acme/ui/components/organisms/LegalEntityCard";
import { PolicyContent } from "@acme/ui/components/organisms/PolicyContent";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";
import { PolicySection } from "@acme/ui/components/organisms/PolicySection";

import { siteConfig } from "../../../lib/siteConfig";
import { xaI18n } from "../../../lib/xaI18n";

export default function ShippingPolicyPage() {
  const brandName = siteConfig.brandName;
  const productDescriptor = siteConfig.catalog.productDescriptor;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title="Shipping policy"
          description={`This page outlines how ${brandName} ships ${productDescriptor}. Replace placeholders with your legal entity details.`}
          descriptionClassName={xaI18n.t("xaB.src.app.pages.shipping.policy.page.l19c32")}
        />
      </Section>

      <Section padding="default">
        <PolicyContent className="space-y-6">
          {siteConfig.showLegalInfo || siteConfig.showContactInfo ? (
            <LegalEntityCard
              title="Company"
              className="rounded-lg border p-4 text-sm"
              titleClassName={xaI18n.t("xaB.src.app.pages.shipping.policy.page.l29c30")}
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

          <PolicySection title="Order processing" titleClassName={xaI18n.t("xaB.src.app.pages.shipping.policy.page.l47c66")}>
            <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.pages.shipping.policy.page.l48c58")}</p>
          </PolicySection>

          <PolicySection title="Shipping methods" titleClassName={xaI18n.t("xaB.src.app.pages.shipping.policy.page.l53c66")}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>{xaI18n.t("xaB.src.app.pages.shipping.policy.page.l55c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.shipping.policy.page.l56c19")}</li>
            </ul>
          </PolicySection>

          <PolicySection title="Notes" titleClassName={xaI18n.t("xaB.src.app.pages.shipping.policy.page.l60c55")}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>{xaI18n.t("xaB.src.app.pages.shipping.policy.page.l62c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.shipping.policy.page.l63c19")}</li>
              {siteConfig.showSocialLinks && siteConfig.whatsappNumber ? (
                <li>{xaI18n.t("xaB.src.app.pages.shipping.policy.page.l65c21")}{siteConfig.whatsappNumber}
                </li>
              ) : null}
            </ul>
          </PolicySection>
        </PolicyContent>
      </Section>
    </main>
  );
}
