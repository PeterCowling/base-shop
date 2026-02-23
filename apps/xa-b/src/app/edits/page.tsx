import Link from "next/link";

import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";

import { XA_EDITS } from "../../lib/xaEdits";
import { xaI18n } from "../../lib/xaI18n";

export default function EditsPage() {
  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Edits</h1>
        <p className="text-muted-foreground">{xaI18n.t("xaB.src.app.edits.page.l13c46")}</p>
      </Section>

      <Section padding="default">
        <Grid columns={{ base: 1, md: 2 }} gap={6}>
          {XA_EDITS.map((edit) => (
            <Link
              key={edit.slug}
              href={`/edits/${edit.slug}`}
              className="rounded-lg border p-5 hover:shadow-sm"
            >
              <div className="text-lg font-semibold">{edit.title}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {edit.description}
              </div>
            </Link>
          ))}
        </Grid>
      </Section>
    </main>
  );
}
