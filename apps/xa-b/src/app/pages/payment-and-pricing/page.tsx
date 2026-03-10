import { Section } from "@acme/design-system/atoms/Section";
import { PolicyContent } from "@acme/ui/components/organisms/PolicyContent";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";
import { PolicySection } from "@acme/ui/components/organisms/PolicySection";

import { xaI18n } from "../../../lib/xaI18n";

export default function PaymentAndPricingPage() {
  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title={xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.title")}
          description={xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.description")}
        />
      </Section>

      <Section padding="default">
        <PolicyContent>
          <PolicySection title={xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.section.pricing")}>
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l30c16")}</p>
          </PolicySection>

          <PolicySection title={xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.section.currency")}>
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l42c16")}</p>
          </PolicySection>

          <PolicySection title={xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.section.taxes.and.duties")}>
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l49c16")}</p>
          </PolicySection>

          <PolicySection title={xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.section.accepted.payment.methods")}>
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l67c16")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l72c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l73c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l74c19")}</li>
            </ul>
          </PolicySection>

          <PolicySection title={xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.section.when.youll.be.charged")}>
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l80c16")}</p>
          </PolicySection>

          <PolicySection title={xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.section.payment.security")}>
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l88c16")}</p>
          </PolicySection>

          <PolicySection title={xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.section.need.help")}>
            <p>{xaI18n.t("xaB.src.app.pages.payment.and.pricing.page.l107c18")}</p>
          </PolicySection>
        </PolicyContent>
      </Section>
    </main>
  );
}
