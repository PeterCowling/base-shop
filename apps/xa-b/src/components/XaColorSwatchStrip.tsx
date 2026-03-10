"use client";

import Link from "next/link";

import { Inline } from "@acme/design-system/primitives/Inline";

import { XaFadeImage } from "./XaFadeImage";

export type XaSwatchItem = {
  key: string;
  label: string;
  swatch: string;
  imageUrl?: string;
  imageAlt?: string;
  isCurrent?: boolean;
  href?: string;
};

export function XaColorSwatchStrip({ items }: { items: XaSwatchItem[] }) {
  return (
    <Inline gap={2} wrap={false}>
      {items.map((item) => {
        const tileClass = `relative h-12 w-12 overflow-hidden rounded-none border bg-surface ${
          item.isCurrent ? "border-foreground" : "xa-border-control"
        }`;
        const inner = item.imageUrl ? (
          <XaFadeImage
            src={item.imageUrl}
            alt={item.imageAlt ?? item.label}
            fill
            sizes="48px" // i18n-exempt -- XA-0022: image sizes hint
            className="object-contain p-1"
          />
        ) : (
          <span
            className="absolute inset-0"
            style={{ backgroundColor: item.swatch }}
            aria-hidden="true"
          />
        );

        if (item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              className={tileClass}
              title={item.label}
              aria-label={item.label}
              aria-current={item.isCurrent ? "page" : undefined}
            >
              {inner}
            </Link>
          );
        }

        return (
          <div
            key={item.key}
            className={tileClass}
            title={item.label}
          >
            {inner}
          </div>
        );
      })}
    </Inline>
  );
}
