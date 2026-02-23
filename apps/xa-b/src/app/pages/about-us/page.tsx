import { Section } from "@acme/design-system/atoms/Section";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";

import { siteConfig } from "../../../lib/siteConfig";

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
          descriptionClassName="mt-2 text-sm text-muted-foreground max-w-none"
        />
      </Section>

      <Section padding="default">
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            This page intentionally avoids placeholder template text (like “.%s”) and is meant
            to be replaced with your real brand story.
          </p>
          {siteConfig.stealthMode ? null : (
            <p>
              Update legal details in <code>apps/xa/src/lib/siteConfig.ts</code>.
            </p>
          )}
        </div>
      </Section>
    </main>
  );
}
