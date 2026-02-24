import { Section } from "@acme/design-system/atoms/Section";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";

import { siteConfig } from "../../../lib/siteConfig";
import { xaI18n } from "../../../lib/xaI18n";

export default function AboutUsPage() {
  const productDescriptor = siteConfig.catalog.productDescriptor;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title="About us"
          description={
            siteConfig.stealthMode
              ? "This site is in private preview."
              : `${siteConfig.brandName} is a demo storefront app focused on ${productDescriptor}.`
          }
          descriptionClassName={xaI18n.t("xaB.src.app.pages.about.us.page.l19c32")}
        />
      </Section>

      <Section padding="default">
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>{xaI18n.t("xaB.src.app.pages.about.us.page.l25c14")}</p>
          {siteConfig.stealthMode ? null : (
            <p>{xaI18n.t("xaB.src.app.pages.about.us.page.l30c16")}<code>{xaI18n.t("xaB.src.app.pages.about.us.page.l31c45")}</code>.
            </p>
          )}
        </div>
      </Section>
    </main>
  );
}
