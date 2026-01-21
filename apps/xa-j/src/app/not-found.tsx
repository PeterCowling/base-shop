/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy not-found page pending design/i18n overhaul */
import Link from "next/link";

import { Section } from "@acme/ui/atoms/Section";
import { Stack } from "@acme/ui/components/atoms/primitives/Stack";

export default function NotFound() {
  return (
    <Section as="div" padding="none" className="px-6 py-16 md:px-12">
      <Stack gap={3} className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you requested doesn’t exist.
        </p>
        <div>
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-border-2 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground"
          >
            Back home
          </Link>
        </div>
      </Stack>
    </Section>
  );
}
