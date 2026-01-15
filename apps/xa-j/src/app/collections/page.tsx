/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy collections page pending i18n overhaul */
import Link from "next/link";

import { Section } from "@ui/atoms/Section";
import { Grid } from "@ui/atoms/Grid";

import { XA_COLLECTIONS } from "../../lib/demoData";

export default function CollectionsIndexPage() {
  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Collections</h1>
        <p className="text-muted-foreground">
          Browse by category.
        </p>
      </Section>

      <Section padding="default">
        <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
          <Link
            href="/collections/all"
            className="rounded-lg border p-4 hover:shadow-sm"
          >
            <div className="font-medium">All products</div>
            <div className="text-sm text-muted-foreground">View everything</div>
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
