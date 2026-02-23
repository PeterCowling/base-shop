import Link from "next/link";

import { Section } from "@acme/design-system/atoms/Section";
import { LegalEntityCard } from "@acme/ui/components/organisms/LegalEntityCard";
import { PolicyContent } from "@acme/ui/components/organisms/PolicyContent";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";
import { PolicySection } from "@acme/ui/components/organisms/PolicySection";

import { XaInlineLink } from "../../../components/XaInlineLink";
import { siteConfig } from "../../../lib/siteConfig";
import { xaI18n } from "../../../lib/xaI18n";

const LAST_UPDATED = xaI18n.t("xaB.src.app.pages.privacy.policy.page.l12c22");

export default function PrivacyPolicyPage() {
  const brandName = siteConfig.brandName;
  const productDescriptor = siteConfig.catalog.productDescriptor;
  const contactEmail =
    siteConfig.showContactInfo && siteConfig.supportEmail ? siteConfig.supportEmail : "";

  const contactEmailLink = contactEmail ? (
    <XaInlineLink href={`mailto:${contactEmail}`} className="underline">
      {contactEmail}
    </XaInlineLink>
  ) : null;

  const companyBlock = siteConfig.showLegalInfo ? (
    <LegalEntityCard title="Data controller">
      {siteConfig.legalEntityName ? <div>{siteConfig.legalEntityName}</div> : null}
      {siteConfig.legalAddress ? <div>{siteConfig.legalAddress}</div> : null}
      {siteConfig.domain ? <div>Domain: {siteConfig.domain}</div> : null}
      {siteConfig.jurisdiction ? <div>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l31c39")}{siteConfig.jurisdiction}</div> : null}
      {contactEmailLink ? <div>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l32c32")}{contactEmailLink}</div> : null}
    </LegalEntityCard>
  ) : null;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title="Privacy Policy"
          description={
            <>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l42c15")}{brandName}{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l43c59")}{productDescriptor}{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l45c53")}</>
          }
          lastUpdated={`Last updated: ${LAST_UPDATED}`}
        />
      </Section>

      <Section padding="default">
        <PolicyContent>
          {companyBlock}

          <PolicySection title="1. What this policy covers">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l58c16")}</p>
          </PolicySection>

          <PolicySection title="2. Personal data we collect">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l68c16")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l71c65")}</span>{" "}{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l71c109")}</li>
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l75c65")}</span>{" "}{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l75c97")}</li>
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l80c65")}</span>{" "}{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l80c107")}</li>
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l85c65")}</span>{" "}{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l85c97")}</li>
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l91c65")}</span>{" "}{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l91c92")}</li>
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l95c65")}</span>{" "}{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l95c106")}</li>
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l101c65")}</span>{" "}{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l101c102")}</li>
            </ul>
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l106c16")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l111c16")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l115c16")}</p>
          </PolicySection>

          <PolicySection title="3. How we use personal data (and legal bases)">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l123c16")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l125c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l126c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l127c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l128c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l129c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l130c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l134c19")}</li>
            </ul>
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l136c16")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold text-foreground">Contract:</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l141c81")}</li>
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l146c65")}</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l146c93")}</li>
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l151c65")}</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l151c90")}</li>
              <li>
                <span className="font-semibold text-foreground">Consent:</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l155c80")}</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. Cookies and similar tech" titleId="cookies">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l162c16")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l171c65")}</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l171c90")}</li>
              <li>
                <span className="font-semibold text-foreground">Preferences</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l175c83")}</li>
              <li>
                <span className="font-semibold text-foreground">Analytics</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l179c81")}</li>
              <li>
                <span className="font-semibold text-foreground">Advertising</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l183c83")}</li>
            </ul>
          </PolicySection>

          <PolicySection title="5. How we share personal data">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l190c16")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l193c65")}</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l193c89")}</li>
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l198c65")}</span>{" "}{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l198c117")}</li>
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l203c65")}</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l203c89")}</li>
              <li>
                <span className="font-semibold text-foreground">Authorities</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l207c83")}</li>
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l211c65")}</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l211c93")}</li>
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l215c65")}</span>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l215c94")}</li>
            </ul>
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l220c16")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l224c16")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l230c16")}</p>
          </PolicySection>

          <PolicySection title="6. International transfers">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l237c16")}</p>
          </PolicySection>

          <PolicySection title="7. Marketing preferences">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l246c16")}</p>
          </PolicySection>

          <PolicySection title="8. Automated decision-making and fraud prevention">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l255c16")}</p>
          </PolicySection>

          <PolicySection title="9. Data retention">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l264c16")}</p>
          </PolicySection>

          <PolicySection title="10. Security">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l273c16")}</p>
          </PolicySection>

          <PolicySection title="11. Your rights">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l282c16")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l287c16")}{" "}
              <Link className="underline" href="/pages/contact-us">
                contact page
              </Link>
              {contactEmailLink ? <> or email {contactEmailLink}</> : null}{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l292c76")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l295c16")}</p>
          </PolicySection>

          <PolicySection title="12. Children">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l302c16")}</p>
          </PolicySection>

          <PolicySection title="13. Third-party links">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l310c16")}</p>
          </PolicySection>

          <PolicySection title="14. Changes to this policy">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l318c16")}</p>
          </PolicySection>

          <PolicySection title="15. Contact us">
            <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l326c16")}{" "}
              <Link className="underline" href="/pages/contact-us">
                contact page
              </Link>
              {contactEmailLink ? <> or email {contactEmailLink}</> : null}.
            </p>
            {siteConfig.showLegalInfo && siteConfig.legalAddress ? (
              <p>{xaI18n.t("xaB.src.app.pages.privacy.policy.page.l334c18")}<span className="text-foreground">{siteConfig.legalAddress}</span>
              </p>
            ) : null}
          </PolicySection>
        </PolicyContent>
      </Section>
    </main>
  );
}
