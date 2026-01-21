import { Inline } from "@/components/primitives/Inline";

import type { Translator } from "./types";

export type ProductTile = {
  title: string;
  subheading: string;
  tags: string[];
};

type Props = {
  translator: Translator;
  tile: ProductTile | null;
};

export function TypoProductTile({ translator, tile }: Props) {
  if (!tile) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-border bg-panel p-6 skylar-card space-y-4">
      <p className="text-xs uppercase skylar-caption text-muted-foreground">
        {translator("nav.products")}
      </p>
      <p className="font-display text-3xl uppercase skylar-heading-tracking">
        {tile.title}
      </p>
      <p className="font-body text-base leading-6 text-muted-foreground">
        {tile.subheading}
      </p>
      <Inline gap={2} className="text-xs uppercase skylar-button-tracking text-muted-foreground">
        {tile.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex min-h-10 min-w-10 items-center rounded-full border border-border px-3 py-1 font-semibold"
          >
            {tag}
          </span>
        ))}
      </Inline>
    </section>
  );
}
