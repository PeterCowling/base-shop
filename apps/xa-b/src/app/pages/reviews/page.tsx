import { Section } from "@acme/design-system/atoms/Section";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";

import { xaI18n } from "../../../lib/xaI18n";

export default function ReviewsPage() {
  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title="Reviews"
          description={xaI18n.t("xaB.src.app.pages.reviews.page.l10c23")}
          descriptionClassName={xaI18n.t("xaB.src.app.pages.reviews.page.l11c32")}
        />
      </Section>
    </main>
  );
}
