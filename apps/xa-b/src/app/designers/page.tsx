"use client";

import * as React from "react";
/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy designers page pending i18n overhaul */
import Link from "next/link";

import { Grid } from "@acme/ui/atoms/Grid";
import { Section } from "@acme/ui/atoms/Section";
import { Input } from "@acme/ui/components/atoms";
import { Breadcrumbs } from "@acme/ui/components/molecules";

import { XA_BRANDS } from "../../lib/demoData";

export default function DesignersIndexPage() {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const designers = q
    ? XA_BRANDS.filter((designer) => designer.name.toLowerCase().includes(q))
    : XA_BRANDS;

  const grouped = React.useMemo(() => {
    const out = new Map<string, typeof designers>();
    for (const designer of designers) {
      const letter = designer.name[0]?.toUpperCase() ?? "#";
      const list = out.get(letter) ?? [];
      list.push(designer);
      out.set(letter, list);
    }
    return out;
  }, [designers]);

  const letters = Array.from(grouped.keys()).sort();

  return (
    <main className="sf-content">
      <Section padding="default">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Designers" }]} />
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Designers</h1>
            <p className="text-sm text-muted-foreground">
              Browse the A-Z directory and search within designers.
            </p>
          </div>
          <div className="w-full sm:w-80">
            <div className="text-xs text-muted-foreground">Search designers</div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type a designer name"
            />
          </div>
        </div>
      </Section>

      <Section padding="default">
        {letters.length ? (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              {letters.map((letter) => (
                <a
                  key={`nav-${letter}`}
                  href={`#designer-${letter}`}
                  className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted"
                >
                  {letter}
                </a>
              ))}
            </div>

            {letters.map((letter) => (
              <div key={letter} id={`designer-${letter}`} className="space-y-3">
                <div className="text-sm font-semibold">{letter}</div>
                <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={4}>
                  {(grouped.get(letter) ?? []).map((designer) => (
                    <Link
                      key={designer.handle}
                      href={`/designer/${designer.handle}`}
                      className="rounded-lg border p-4 hover:shadow-sm"
                    >
                      <div className="font-medium">{designer.name}</div>
                      <div className="text-sm text-muted-foreground">View designer</div>
                    </Link>
                  ))}
                </Grid>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border p-6">
            <div className="font-medium">No designers found.</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Try a different name or clear the search.
            </div>
          </div>
        )}
      </Section>
    </main>
  );
}
