import { Link } from "react-router-dom";
import type { TFunction } from "i18next";

import { Grid } from "@acme/ui/atoms/Grid";
import { CfImage } from "@acme/ui/atoms/CfImage";

import { destinationLinkPillClass } from "../styles";
import { resolveTransportIcon } from "../transport";
import type { AugmentedDestinationSection } from "../types";
import { resolveHref } from "../richText";

export type DestinationSectionsProps = {
  sections: AugmentedDestinationSection[];
  showEmptyState: boolean;
  t: TFunction<"howToGetHere">;
  internalBasePath: string;
};

export function DestinationSections({
  sections,
  showEmptyState,
  t,
  internalBasePath,
}: DestinationSectionsProps) {
  if (showEmptyState) {
    return (
      <p className="rounded-3xl border border-brand-outline/30 bg-brand-surface p-6 text-base font-medium text-brand-heading shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/60 dark:text-brand-surface">
        {t("filters.noResults")}
      </p>
    );
  }

  return sections.map((section) => (
    <article
      id={section.id}
      key={section.id}
      className="rounded-3xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/60"
    >
      <Grid
        as="div"
        columns={{ base: 1, md: section.image ? 2 : 1 }}
        gap={5}
        className="md:items-start"
      >
        <div>
          <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-surface">{section.name}</h2>
          <ul className="mt-6 space-y-3">
            {section.links.map((link) => {
              const resolvedHref = resolveHref(link, internalBasePath);
              const Icon = resolveTransportIcon(link);
              const iconNode = Icon ? (
                <span className="me-3 inline-flex size-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary transition duration-150 group-hover:bg-brand-primary/15 dark:bg-brand-secondary/20 dark:text-brand-secondary">
                  <Icon aria-hidden className="size-4" />
                </span>
              ) : null;

              return (
                <li key={`${section.id}-${resolvedHref}`}>
                  {link.internal ? (
                    <Link className={destinationLinkPillClass} prefetch="intent" to={resolvedHref}>
                      {iconNode}
                      <span className="flex-1 text-start">{link.label}</span>
                    </Link>
                  ) : (
                    <a
                      className={destinationLinkPillClass}
                      href={resolvedHref}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {iconNode}
                      <span className="flex-1 text-start">{link.label}</span>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        {section.image ? (
          <figure className="overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-outline/5 shadow-sm dark:border-brand-outline/30">
            <CfImage
              src={section.image.src}
              alt={section.image.alt}
              preset="gallery"
              className="size-full object-cover"
              data-aspect="4/3"
            />
          </figure>
        ) : null}
      </Grid>
    </article>
  ));
}
