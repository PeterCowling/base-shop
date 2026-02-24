import Link from "next/link";

import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";

import { XA_COLLECTIONS } from "../../lib/demoData";
import { xaI18n } from "../../lib/xaI18n";

export default function CollectionsIndexPage() {
  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Collections</h1>
        <p className="text-muted-foreground">{xaI18n.t("xaB.src.app.collections.page.l13c46")}</p>
      </Section>

      <Section padding="default">
        <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
          <Link
            href="/collections/all"
            className="rounded-lg border p-4 hover:shadow-sm"
          >
            <div className="font-medium">All products</div>
            <div className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.collections.page.l25c60")}</div>
          </Link>
          {XA_COLLECTIONS.map((c) => (
            <Link
              key={c.handle}
              href={`/collections/${c.handle}`}
              className="rounded-lg border p-4 hover:shadow-sm"
            >
              <div className="font-medium">{c.title}</div>
              {c.description ? (
                <div className="text-sm text-muted-foreground">
                  {c.description}
                </div>
              ) : null}
            </Link>
          ))}
        </Grid>
      </Section>
    </main>
  );
}
