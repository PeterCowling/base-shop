import Link from "next/link";

import { Section } from "@acme/design-system/atoms/Section";
import { Stack } from "@acme/design-system/primitives/Stack";

import { xaI18n } from "../lib/xaI18n";

export default function NotFound() {
  return (
    <Section as="div" padding="none" className="mx-auto max-w-2xl px-6 py-16 md:px-12">
      <Stack gap={3}>
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.not.found.l11c54")}</p>
        <div>
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-border-2 bg-surface px-4 py-2 text-xs font-semibold uppercase xa-tracking-030 text-foreground"
          >
            Back home
          </Link>
        </div>
      </Stack>
    </Section>
  );
}
