// packages/ui/src/components/cms/blocks/SocialProof.tsx
"use client";

import { useEffect, useState } from "react";
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

interface Props {
  /** URL returning an array of order events */
  source?: string;
  /** How often to rotate messages in ms */
  frequency?: number;
  rating?: RatingProps;
  testimonials?: Testimonial[];
}

/**
 * Display social proof via a rating summary and testimonials, or fall back to
 * rotating order events fetched from a remote source.
 */
export default function SocialProof({
  source,
  frequency = 5000,
  rating,
  testimonials,
}: Props) {
  const hasRating = Boolean(rating);
  const hasTestimonials = Boolean(testimonials && testimonials.length > 0);

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

  if (hasRating || hasTestimonials) {
    return (
      <div className="space-y-4 text-center">
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
      </div>
    );
  }

  if (!source || events.length === 0) return null;

  const event = events[index];
  const minutes = Math.floor((Date.now() - event.timestamp) / 60000);

  return (
    <div className="text-sm">
      {`${event.customer} bought ${event.product} ${minutes} min ago`}
    </div>
  );
}

