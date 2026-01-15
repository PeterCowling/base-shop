"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy search page pending design/i18n overhaul */

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Section } from "@ui/atoms/Section";
import { Input } from "@ui/components/atoms";

import { XaProductListing } from "../../components/XaProductListing.client";
import { useXaProductSearch } from "../../lib/search/useXaProductSearch";

function SearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [value, setValue] = React.useState(q);

  React.useEffect(() => setValue(q), [q]);

  React.useEffect(() => {
    if (value === q) return;
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (!value.trim()) next.delete("q");
      else next.set("q", value.trim());
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [value, q, pathname, router, searchParams]);

  const { products } = useXaProductSearch(value);
  const displayQuery = value.trim();

  return (
    <>
      <Section padding="default">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Search</div>
          <form
            className="flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const next = new URLSearchParams(searchParams.toString());
              if (!value.trim()) next.delete("q");
              else next.set("q", value.trim());
              const qs = next.toString();
              router.push(qs ? `${pathname}?${qs}` : pathname);
            }}
          >
            <Input
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search products"
            />
          </form>
        </div>
      </Section>

      <XaProductListing
        title={displayQuery ? `# Search: ${displayQuery}` : "# Search"}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
        products={products}
      />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}
