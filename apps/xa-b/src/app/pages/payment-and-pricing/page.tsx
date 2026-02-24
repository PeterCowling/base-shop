import { Section } from "@acme/design-system/atoms/Section";
import { PolicyContent } from "@acme/ui/components/organisms/PolicyContent";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";
import { PolicySection } from "@acme/ui/components/organisms/PolicySection";

import { XaInlineLink } from "../../../components/XaInlineLink";
import { siteConfig } from "../../../lib/siteConfig";
import { xaI18n } from "../../../lib/xaI18n";

export default function PaymentAndPricingPage() {
  const productDescriptor = siteConfig.catalog.productDescriptor;
  const contactEmailLink =
    siteConfig.showContactInfo && siteConfig.supportEmail ? (
      <XaInlineLink href={`mailto:${siteConfig.supportEmail}`} className="underline">
        {siteConfig.supportEmail}
      </XaInlineLink>
    ) : null;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title="Payments and pricing"
          description={`Here’s how pricing works, what you’ll pay at checkout, and which payment options may be available for your ${productDescriptor} order.`}
        />
      </Section>

      <Section padding="default">
        <PolicyContent>
          <PolicySection title="1. Pricing">
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l30c16")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l35c16")}</p>
          </PolicySection>

          <PolicySection title="2. Currency">
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l42c16")}</p>
          </PolicySection>

          <PolicySection title="3. Taxes and duties">
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l49c16")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l55c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l59c19")}</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. Accepted payment methods">
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l67c16")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l72c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l73c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l74c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l75c19")}</li>
            </ul>
          </PolicySection>

          <PolicySection title="5. When you’ll be charged">
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l80c16")}</p>
          </PolicySection>

          <PolicySection title="6. Payment security">
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l88c16")}</p>
          </PolicySection>

          <PolicySection title="7. Promotions" titleId="promotions">
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l96c16")}</p>
          </PolicySection>

          <PolicySection title="8. Need help?">
            {contactEmailLink ? (
              <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l105c18")}{contactEmailLink}.</p>
            ) : (
              <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l107c18")}</p>
            )}
          </PolicySection>
        </PolicyContent>
      </Section>
    </main>
  );
}
