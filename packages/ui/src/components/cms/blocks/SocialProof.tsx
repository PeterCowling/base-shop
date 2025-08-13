// packages/ui/src/components/cms/blocks/SocialProof.tsx
"use client";

import { useEffect, useState } from "react";

interface OrderEvent {
  customer: string;
  product: string;
  /** Timestamp in milliseconds */
  timestamp: number;
}

interface Props {
  /** URL returning an array of order events */
  source: string;
  /** How often to rotate messages in ms */
  frequency?: number;
}

/** Display recent order events like "Alice bought X 5 min ago" */
export default function SocialProof({ source, frequency = 5000 }: Props) {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
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
  }, [source]);

  useEffect(() => {
    if (events.length === 0) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % events.length),
      frequency
    );
    return () => clearInterval(id);
  }, [events, frequency]);

  if (events.length === 0) return null;

  const event = events[index];
  const minutes = Math.floor((Date.now() - event.timestamp) / 60000);

  return (
    <div className="text-sm">
      {`${event.customer} bought ${event.product} ${minutes} min ago`}
    </div>
  );
}

