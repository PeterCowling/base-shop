/**
 * Service schema block handler.
 */
import type { ComponentProps } from "react";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import ServiceStructuredData from "@/components/seo/ServiceStructuredData";
import getGuideResource from "@/routes/guides/utils/getGuideResource";

import type { GuideSeoTemplateContext } from "../../guide-seo/types";
import type { ServiceSchemaBlockOptions } from "../types";
import { DEFAULT_IMAGE_DIMENSIONS } from "../utils/constants";
import { normaliseString, resolveTranslation } from "../utils/stringHelpers";

import type { BlockAccumulator } from "./BlockAccumulator";

type ServiceOffers = NonNullable<ComponentProps<typeof ServiceStructuredData>["offers"]>;
type ServiceOffer = ServiceOffers[number];

function normaliseServiceOffers(value: unknown): ServiceOffer[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const offers = value
    .map((offer) => {
      if (!offer || typeof offer !== "object") {
        return null;
      }
      const record = offer as Record<string, unknown>;
      const price = normaliseString(record["price"]);
      if (!price) {
        return null;
      }

      const priceCurrency = normaliseString(record["priceCurrency"]);
      const availability = normaliseString(record["availability"]);
      const description = normaliseString(record["description"]);

      const resolved: ServiceOffer = { price };
      if (priceCurrency) {
        resolved.priceCurrency = priceCurrency;
      }
      if (availability) {
        resolved.availability = availability;
      }
      if (description) {
        resolved.description = description;
      }

      return resolved;
    })
    .filter((offer): offer is ServiceOffer => offer != null);

  return offers.length > 0 ? offers : undefined;
}

export function applyServiceSchemaBlock(acc: BlockAccumulator, options?: ServiceSchemaBlockOptions): void {
  if (options?.source) {
    acc.warn(`serviceSchema block source "${options.source}" currently falls back to translation-based data`);
  }
  acc.addSlot("head", (context: GuideSeoTemplateContext) => {
    const contentKey = options?.contentKey ?? acc.manifest.contentKey;
    const name = resolveTranslation(context.translateGuides, options?.nameKey) ?? context.article.title;
    const description =
      resolveTranslation(context.translateGuides, options?.descriptionKey) ?? context.article.description;
    const serviceType = resolveTranslation(
      context.translateGuides,
      options?.serviceTypeKey ?? `content.${contentKey}.serviceType`,
    );
    const areaServed = resolveTranslation(
      context.translateGuides,
      options?.areaServedKey ?? `content.${contentKey}.areaServed`,
    );
    const provider = resolveTranslation(context.translateGuides, options?.providerNameKey);

    const imagePath = options?.image ?? context.ogImage?.url;
    const image =
      options?.image && options.image !== context.ogImage?.url
        ? buildCfImageUrl(options.image, {
            width: DEFAULT_IMAGE_DIMENSIONS.width,
            height: DEFAULT_IMAGE_DIMENSIONS.height,
            quality: DEFAULT_IMAGE_DIMENSIONS.quality,
            format: DEFAULT_IMAGE_DIMENSIONS.format,
          })
        : imagePath;

    let sameAs: string[] | undefined;
    if (Array.isArray(options?.sameAsKeys) && options.sameAsKeys.length > 0) {
      sameAs = options.sameAsKeys
        .map((key) => resolveTranslation(context.translateGuides, key))
        .filter((value): value is string => Boolean(value));
    }

    const offers = normaliseServiceOffers(
      options?.offersKey ? getGuideResource(context.lang, options.offersKey) : undefined,
    );

    const serviceProps = {
      name: name ?? context.article.title,
      description: description ?? context.article.description,
      image,
      inLanguage: context.lang,
      url: context.canonicalUrl,
      ...(serviceType ? { serviceType } : {}),
      ...(areaServed ? { areaServed } : {}),
      ...(provider ? { providerName: provider } : {}),
      ...(sameAs && sameAs.length > 0 ? { sameAs } : {}),
      ...(offers && offers.length > 0 ? { offers } : {}),
    };
    return <ServiceStructuredData {...serviceProps} />;
  });
}
