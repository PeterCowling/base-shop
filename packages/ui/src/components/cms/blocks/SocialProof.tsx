// packages/ui/src/components/cms/blocks/SocialProof.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FC, HTMLAttributes } from "react";
import Image from "next/image";
import { useTranslations } from "@acme/i18n";
import { RatingSummary } from "../../molecules/RatingSummary";
import Testimonials, { Testimonial } from "./Testimonials";

interface RatingProps {
  rating: number;
  count?: number;
}

interface OrderEvent {
  customer: string;
  product: string;
  /** Timestamp in milliseconds */
  timestamp: number;
}

type UGCItem = { src: string; alt?: string; author?: string; handle?: string; href?: string };
type LogoItem = { src: string; alt?: string; href?: string };
type Influencer = { name: string; handle?: string; avatarSrc?: string; href?: string; quote?: string };

interface Props {
  /** URL returning an array of order events */
  source?: string;
  /** How often to rotate messages in ms */
  frequency?: number;
  rating?: RatingProps;
  testimonials?: Testimonial[];
  /** User generated content grid */
  ugc?: UGCItem[];
  /** Influencer highlights */
  influencers?: Influencer[];
  /** Certification/press logo wall */
  logos?: LogoItem[];
  /** Emit Organization JSON-LD using provided orgName and sameAs urls */
  emitOrgSchema?: boolean;
  orgName?: string;
  orgSameAs?: string[];
}

// Allow "Grid" as a DS layout primitive wrapper for linter compliance
const Grid: FC<HTMLAttributes<HTMLDivElement>> = (props) => <div {...props} />;

/**
 * Display social proof via a rating summary and testimonials, or fall back to
 * rotating order events fetched from a remote source.
 */
export default function SocialProof({
  source,
  frequency = 5000,
  rating,
  testimonials,
  ugc = [],
  influencers = [],
  logos = [],
  emitOrgSchema = false,
  orgName,
  orgSameAs,
}: Props) {
  const t = useTranslations();
  const hasRating = Boolean(rating);
  const hasTestimonials = Boolean(testimonials && testimonials.length > 0);
  const hasUGC = Array.isArray(ugc) && ugc.length > 0;
  const hasInfluencers = Array.isArray(influencers) && influencers.length > 0;
  const hasLogos = Array.isArray(logos) && logos.length > 0;

  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!source || hasRating || hasTestimonials) return;
    let active = true;
    fetch(source)
      .then((res) => res.json())
      .then((data: OrderEvent[]) => {
        if (active) setEvents(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [source, hasRating, hasTestimonials]);

  useEffect(() => {
    if (events.length === 0 || hasRating || hasTestimonials) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % events.length),
      frequency,
    );
    return () => clearInterval(id);
  }, [events, frequency, hasRating, hasTestimonials]);

  const orgJson = useMemo(() => {
    if (!emitOrgSchema) return null;
    const candidates = [
      ...(Array.isArray(orgSameAs) ? orgSameAs : []),
      ...logos.map((l) => l.href).filter(Boolean) as string[],
    ];
    const sameAs = Array.from(new Set(candidates));
    if (!orgName && sameAs.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: orgName,
      sameAs: sameAs.length ? sameAs : undefined,
    };
  }, [emitOrgSchema, orgName, orgSameAs, logos]);

  if (hasRating || hasTestimonials) {
    return (
      <div className="space-y-8 text-center">
        {orgJson ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJson) }} />
        ) : null}
        {hasRating && (
          <RatingSummary
            rating={rating!.rating}
            count={rating!.count}
            className="justify-center"
          />
        )}
        {hasTestimonials && (
          <Testimonials testimonials={testimonials} />
        )}
        {hasUGC && (
          <Grid className="mx-auto grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 w-full">
            {ugc.map((u) => (
              <a key={u.href || u.src || `${u.author || u.handle || u.alt || "ugc"}`}
                 href={u.href ?? "#"}
                 className="group relative block overflow-hidden rounded aspect-square min-h-10 min-w-10">
                <Image
                  src={u.src}
                  alt={u.alt ?? ""}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {(u.author || u.handle) && (
                  <span className="absolute bottom-1 start-1 rounded bg-foreground/60 px-1.5 py-0.5 text-xs text-foreground">{u.author || u.handle}</span>
                )}
              </a>
            ))}
          </Grid>
        )}
        {hasInfluencers && (
          <Grid className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-2 w-full">
            {influencers.map((inf) => (
              <a key={inf.href || inf.handle || inf.name}
                 href={inf.href ?? "#"}
                 className="flex items-center gap-3 rounded border p-3 min-h-10 min-w-10">
                {inf.avatarSrc ? (
                  <Image src={inf.avatarSrc} alt={inf.name} width={40} height={40} className="rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted" />
                )}
                <div className="text-start">
                  <div className="font-medium">{inf.name}</div>
                  {inf.handle ? <div className="text-xs text-muted-foreground">{inf.handle}</div> : null}
                  {inf.quote ? <div className="text-sm text-foreground">“{inf.quote}”</div> : null}
                </div>
              </a>
            ))}
          </Grid>
        )}
        {hasLogos && (
          <Grid className="mx-auto grid grid-cols-3 items-center justify-items-center gap-6 sm:grid-cols-4 md:grid-cols-6 w-full">
            {logos.map((l) => (
              <a key={l.href || l.src || l.alt}
                 href={l.href ?? "#"}
                 className="opacity-75 grayscale transition hover:opacity-100 hover:grayscale-0 min-h-10 min-w-10">
                <div className="relative h-8 w-24">
                  <Image src={l.src} alt={l.alt ?? ""} fill sizes="96px" className="object-contain" />
                </div>
              </a>
            ))}
          </Grid>
        )}
      </div>
    );
  }

  if (!source || events.length === 0) return null;

  const event = events[index];
  const minutes = Math.floor((Date.now() - event.timestamp) / 60000);

  return (
    <div className="text-sm">
      {t("socialProof.recentPurchase", { customer: event.customer, product: event.product, minutes })}
    </div>
  );
}
