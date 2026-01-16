/* eslint-disable import/require-twitter-card, import/require-xdefault-canonical -- TECH-000: Non-route helper under routes; head tags come from the guide route meta()/links() per src/routes/AGENTS.md §3 */
import { type ComponentProps } from "react";

import ServiceStructuredData from "@/components/seo/ServiceStructuredData";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import getGuideResource from "@/routes/guides/utils/getGuideResource";

import type { BlockAccumulator } from "../blockAccumulator";
import { getServiceSchemaModule } from "../moduleRegistry";
import type { GuideSeoTemplateContext } from "../../guide-seo/types";
import type { ServiceSchemaBlockOptions } from "../types";
import { DEFAULT_IMAGE_DIMENSIONS, resolveTranslation } from "../utils";

type ServiceStructuredDataProps = ComponentProps<typeof ServiceStructuredData>;
type MonetaryAmount = NonNullable<ServiceStructuredDataProps["offers"]>[number];

type ServiceSchemaPayload = Pick<
  ServiceStructuredDataProps,
  "serviceType" | "areaServed" | "providerName" | "image" | "sameAs" | "offers" | "inLanguage" | "url"
> & {
  name: string;
  description: string;
};

type ServiceSchemaStringKey = {
  [K in keyof ServiceSchemaPayload]-?: ServiceSchemaPayload[K] extends string | undefined ? K : never;
}[keyof ServiceSchemaPayload];

type ServiceSchemaOverrides = Partial<ServiceSchemaPayload>;

type ServiceSchemaResolver = (
  context: GuideSeoTemplateContext,
  base: ServiceSchemaPayload,
) => ServiceSchemaOverrides | null;

const SERVICE_SCHEMA_EXPORT_CANDIDATES = [
  "buildGuideServiceSchema",
  "buildServiceSchema",
  "createServiceSchema",
  "resolveServiceSchema",
  "getServiceSchema",
  "buildServiceData",
  "createServiceData",
  "serviceSchema",
  "default",
] as const;

const SERVICE_SCHEMA_FALLBACK_NAME_KEY = "labels.serviceSchemaFallbackName";

export function applyServiceSchemaBlock(acc: BlockAccumulator, options?: ServiceSchemaBlockOptions): void {
  const module = findServiceSchemaModule(options);
  const resolver = module ? createServiceSchemaResolver(module) : null;

  if ((options?.module || options?.source) && !resolver) {
    const ref = options.module ?? options?.source;
    if (ref) {
      acc.warn(`serviceSchema block source "${ref}" could not be resolved; falling back to translation-based data`);
    }
  }

  acc.addSlot("head", (context) => {
    const contentKey = options?.contentKey ?? acc.manifest.contentKey;
    const name =
      resolveTranslation(context.translateGuides, options?.nameKey) ??
      context.article.title;
    const description =
      resolveTranslation(context.translateGuides, options?.descriptionKey) ??
      context.article.description;
    const serviceType = resolveTranslation(context.translateGuides, options?.serviceTypeKey ?? `content.${contentKey}.serviceType`);
    const areaServed = resolveTranslation(
      context.translateGuides,
      options?.areaServedKey ?? `content.${contentKey}.areaServed`,
    );
    const provider = resolveTranslation(context.translateGuides, options?.providerNameKey);
    const fallbackServiceName = sanitizeServiceString(
      resolveTranslation(context.translateGuides, SERVICE_SCHEMA_FALLBACK_NAME_KEY),
    );

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

    let offers: unknown;
    if (options?.offersKey) {
      offers = getGuideResource(context.lang, options.offersKey);
    }

    const offersPayload = Array.isArray(offers) ? offers.filter(isMonetaryAmount) : undefined;

    const fallbackTitle =
      typeof context.article.title === "string" && context.article.title.trim().length > 0
        ? context.article.title.trim()
        : context.article.title != null
        ? String(context.article.title)
        : "";
    const fallbackDescription =
      typeof context.article.description === "string" && context.article.description.trim().length > 0
        ? context.article.description.trim()
        : context.article.description != null
        ? String(context.article.description)
        : fallbackTitle;

    const fallbackTitleCandidate = sanitizeServiceString(fallbackTitle);
    const fallbackDescriptionCandidate = sanitizeServiceString(fallbackDescription);
    const resolvedName =
      sanitizeServiceString(name) ??
      fallbackServiceName ??
      fallbackTitleCandidate ??
      fallbackDescriptionCandidate ??
      sanitizeServiceString(serviceType) ??
      sanitizeServiceString(provider) ??
      sanitizeServiceString(context.metaKey) ??
      sanitizeServiceString(context.guideKey) ??
      context.metaKey;
    const resolvedDescription = sanitizeServiceString(description) ?? fallbackDescription;

    const basePayload: ServiceSchemaPayload = {
      name: resolvedName,
      description: resolvedDescription || fallbackDescription || resolvedName || fallbackTitle || "",
      serviceType,
      areaServed,
      providerName: provider,
      image,
      sameAs,
      offers: offersPayload,
      inLanguage: context.lang,
      url: context.canonicalUrl,
    };

    const overrides = resolver ? resolver(context, basePayload) : null;
    const merged: ServiceSchemaPayload = overrides ? { ...basePayload, ...overrides } : basePayload;

    return (
      <ServiceStructuredData
        name={merged.name}
        description={merged.description}
        serviceType={merged.serviceType}
        areaServed={merged.areaServed}
        providerName={merged.providerName}
        image={merged.image}
        sameAs={merged.sameAs}
        offers={merged.offers}
        inLanguage={merged.inLanguage}
        url={merged.url}
      />
    );
  });
}

function findServiceSchemaModule(options?: ServiceSchemaBlockOptions): Record<string, unknown> | null {
  if (!options) return null;
  if (options.module) {
    const match = getServiceSchemaModule(options.module);
    if (match) return match;
  }
  if (options.source) {
    const match = getServiceSchemaModule(options.source);
    if (match) return match;
  }
  return null;
}

function isMonetaryAmount(value: unknown): value is MonetaryAmount {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const price = candidate.price;
  if (typeof price !== "string" || price.trim().length === 0) {
    return false;
  }
  const priceCurrency = candidate.priceCurrency;
  if (priceCurrency != null && typeof priceCurrency !== "string") {
    return false;
  }
  const availability = candidate.availability;
  if (availability != null && typeof availability !== "string") {
    return false;
  }
  const description = candidate.description;
  if (description != null && typeof description !== "string") {
    return false;
  }
  return true;
}

function sanitizeServiceString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeSameAs(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const entries = value
    .map((item) => sanitizeServiceString(item))
    .filter((item): item is string => typeof item === "string");
  if (entries.length === 0) return undefined;
  return Array.from(new Set(entries));
}

function sanitizeOffer(value: unknown): MonetaryAmount | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const price = sanitizeServiceString(record.price);
  if (!price) return null;
  const offer: MonetaryAmount = { price };
  const priceCurrency = sanitizeServiceString(record.priceCurrency);
  if (priceCurrency) offer.priceCurrency = priceCurrency;
  const availability = sanitizeServiceString(record.availability);
  if (availability) offer.availability = availability;
  const description = sanitizeServiceString(record.description);
  if (description) offer.description = description;
  return offer;
}

function sanitizeServiceSchemaOverrides(value: unknown): ServiceSchemaOverrides | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const overrides: ServiceSchemaOverrides = {};

  const assignString = (key: ServiceSchemaStringKey) => {
    const sanitized = sanitizeServiceString(record[key]);
    if (sanitized) {
      overrides[key] = sanitized;
    }
  };

  assignString("name");
  assignString("description");
  assignString("serviceType");
  assignString("areaServed");
  assignString("providerName");
  assignString("image");
  assignString("inLanguage");
  assignString("url");

  const sameAs = sanitizeSameAs(record.sameAs);
  if (sameAs) {
    overrides.sameAs = sameAs;
  }

  const offersRaw = record.offers;
  if (Array.isArray(offersRaw)) {
    const offers = offersRaw
      .map((entry) => sanitizeOffer(entry))
      .filter((entry): entry is MonetaryAmount => entry != null);
    if (offers.length > 0) {
      overrides.offers = offers;
    }
  }

  return Object.keys(overrides).length > 0 ? overrides : null;
}

function createServiceSchemaResolver(module: Record<string, unknown>): ServiceSchemaResolver | null {
  const createResolverFromCandidate = (candidate: unknown): ServiceSchemaResolver | null => {
    if (typeof candidate === "function") {
      const factory = candidate as (...args: unknown[]) => unknown;
      return (context, base) => {
        const attempts = [
          () => factory(context, base),
          () => factory(context),
          () => factory(base),
          () => factory(),
        ];
        for (const attempt of attempts) {
          try {
            const result = attempt();
            const overrides = sanitizeServiceSchemaOverrides(result);
            if (overrides) {
              return overrides;
            }
          } catch {
            // Ignore attempt errors and try next signature
          }
        }
        return null;
      };
    }

    const overrides = sanitizeServiceSchemaOverrides(candidate);
    if (!overrides) {
      return null;
    }

    return () => overrides;
  };

  for (const key of SERVICE_SCHEMA_EXPORT_CANDIDATES) {
    if (Object.prototype.hasOwnProperty.call(module, key)) {
      const resolver = createResolverFromCandidate(module[key as keyof typeof module]);
      if (resolver) {
        return resolver;
      }
    }
  }

  return null;
}
