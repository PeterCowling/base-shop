import { Section } from "@acme/design-system/atoms/Section";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";

export default function ReviewsPage() {
  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title="Reviews"
          description="Reviews are optional in the merged spec; this page is a placeholder."
          descriptionClassName="mt-2 text-sm text-muted-foreground max-w-none"
        />
      </Section>
    </main>
  );
}
