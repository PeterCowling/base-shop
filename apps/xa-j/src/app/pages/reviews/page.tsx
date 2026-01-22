/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy reviews page pending design/i18n overhaul */
import { Section } from "@acme/design-system/atoms/Section";

export default function ReviewsPage() {
  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reviews are optional in the merged spec; this page is a placeholder.
        </p>
      </Section>
    </main>
  );
}
