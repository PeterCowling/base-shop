import { Section } from "@acme/design-system/atoms/Section";
import { LegalEntityCard } from "@acme/ui/components/organisms/LegalEntityCard";
import { PolicyContent } from "@acme/ui/components/organisms/PolicyContent";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";
import { PolicySection } from "@acme/ui/components/organisms/PolicySection";

import { XaInlineLink } from "../../../components/XaInlineLink";
import { siteConfig } from "../../../lib/siteConfig";
import { xaI18n } from "../../../lib/xaI18n";

export default function TermsOfServicePage() {
  const productDescriptor = siteConfig.catalog.productDescriptor;
  const packagingItems = siteConfig.catalog.packagingItems;
  const companyBlock = siteConfig.showLegalInfo ? (
    <LegalEntityCard title="Who we are">
      {siteConfig.legalEntityName ? <div>{siteConfig.legalEntityName}</div> : null}
      {siteConfig.legalAddress ? <div>{siteConfig.legalAddress}</div> : null}
      {siteConfig.domain ? <div>Domain: {siteConfig.domain}</div> : null}
      {siteConfig.jurisdiction ? <div>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l18c39")}{siteConfig.jurisdiction}</div> : null}
    </LegalEntityCard>
  ) : null;

  const contactBlock = siteConfig.showContactInfo && siteConfig.supportEmail ? (
    <p>
      Contact: <XaInlineLink className="underline" href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</XaInlineLink>
    </p>
  ) : (
    <p>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l27c8")}</p>
  );

  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title="Terms of Service"
          description={`These Terms set out how you may access and use this site, purchase ${productDescriptor}, and interact with our services. Please read them carefully before ordering.`}
        />
      </Section>

      <Section padding="default">
        <PolicyContent>
          {companyBlock}

          <PolicySection title="1. Using the site">
            <p>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l44c16")}</p>
          </PolicySection>

          <PolicySection title="2. Products & descriptions">
            <p>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l52c16")}{packagingItems}{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l54c63")}</p>
          </PolicySection>

          <PolicySection title="3. Pricing & payment">
            <ul className="list-disc space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l61c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l62c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l63c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l64c19")}</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. Orders & contract">
            <p>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l69c16")}</p>
          </PolicySection>

          <PolicySection title="5. Delivery & risk">
            <ul className="list-disc space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l78c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l79c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l80c19")}</li>
            </ul>
          </PolicySection>

          <PolicySection title="6. Returns & cancellations">
            <p>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l85c16")}</p>
          </PolicySection>

          <PolicySection title="7. Accounts & security">
            <p>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l94c16")}</p>
          </PolicySection>

          <PolicySection title="8. Acceptable use">
            <ul className="list-disc space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l102c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l103c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l104c19")}</li>
            </ul>
          </PolicySection>

          <PolicySection title="9. Intellectual property">
            <p>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l109c16")}</p>
          </PolicySection>

          <PolicySection title="10. Third-party links">
            <p>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l116c16")}</p>
          </PolicySection>

          <PolicySection title="11. Warranties & liability">
            <ul className="list-disc space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l124c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l125c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l129c19")}</li>
            </ul>
          </PolicySection>

          <PolicySection title="12. Force majeure">
            <p>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l137c16")}</p>
          </PolicySection>

          <PolicySection title="13. Privacy">
            <p>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l144c16")}</p>
          </PolicySection>

          <PolicySection title="14. Changes to these Terms">
            <p>{xaI18n.t("xaB.src.app.pages.terms.of.service.page.l151c16")}</p>
          </PolicySection>

          <PolicySection title="15. Contact">
            {contactBlock}
          </PolicySection>
        </PolicyContent>
      </Section>
    </main>
  );
}
