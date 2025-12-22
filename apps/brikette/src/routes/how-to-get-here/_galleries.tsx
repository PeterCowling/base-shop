import { Grid } from "@acme/ui/atoms";
import { CfResponsiveImage } from "@/components/images/CfResponsiveImage";
import type { RouteDefinition } from "@/lib/how-to-get-here/definitions";
import type { RouteContent } from "@/lib/how-to-get-here/schema";
import type { ReactNode } from "react";

import { getValueAtPath, isPlainObject } from "./content-utils";

export function renderGallery(
  definition: RouteDefinition,
  content: RouteContent,
  defaultAlt: string,
): ReactNode[] {
  if (!definition.galleries || definition.galleries.length === 0) {
    return [];
  }
  return definition.galleries.map((gallery) => {
    const basePath = gallery.key.replace(/\.items$/, "");
    const galleryMeta = getValueAtPath(content, basePath);
    let itemsMeta: Record<string, { alt?: string; caption?: string }> | undefined;
    if (isPlainObject(galleryMeta)) {
      const maybeItems = (galleryMeta as Record<string, unknown>)["items"];
      if (isPlainObject(maybeItems)) {
        itemsMeta = maybeItems as Record<string, { alt?: string; caption?: string }>;
      }
    }

    return (
      <section
        key={gallery.key}
        className="space-y-6 rounded-3xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/80"
      >
        <Grid as="ul" columns={{ base: 1, sm: 1, md: 2 }} gap={6} className="list-none p-0">
          {gallery.items.map((item) => {
            const meta = itemsMeta?.[item.id] ?? {};
            return (
              <li key={item.id} className="m-0">
                <figure className="overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-surface shadow-sm">
                  <CfResponsiveImage
                    src={item.src}
                    alt={meta.alt ?? meta.caption ?? defaultAlt}
                    preset="gallery"
                    className="size-full object-cover"
                    data-aspect={item.aspectRatio ?? "4/3"}
                  />
                  {meta.caption ? (
                    <figcaption className="bg-brand-surface px-4 py-3 text-sm text-brand-text/80 dark:bg-brand-surface/70 dark:text-brand-surface/80">
                      {meta.caption}
                    </figcaption>
                  ) : null}
                </figure>
              </li>
            );
          })}
        </Grid>
      </section>
    );
  });
}
