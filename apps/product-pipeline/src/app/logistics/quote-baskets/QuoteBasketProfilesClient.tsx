"use client";

import { useCallback, useEffect, useState } from "react";

import QuoteBasketCreateCard from "./QuoteBasketCreateCard";
import QuoteBasketProfilesList from "./QuoteBasketProfilesList";
import type { QuoteBasketProfile, QuoteBasketStrings } from "./types";

export default function QuoteBasketProfilesClient({
  strings,
}: {
  strings: QuoteBasketStrings;
}) {
  const [profiles, setProfiles] = useState<QuoteBasketProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/logistics/quote-baskets?limit=50");
      if (!response.ok) return;
      const data = (await response.json()) as {
        ok?: boolean;
        profiles?: QuoteBasketProfile[];
      };
      if (data.ok && Array.isArray(data.profiles)) {
        setProfiles(data.profiles);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-border-1 bg-surface-2 p-4 text-sm text-foreground/70">
        <div className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.help.label}
        </div>
        <div className="mt-2 font-semibold">{strings.help.title}</div>
        <p className="mt-2 text-sm text-foreground/70">{strings.help.body}</p>
      </div>
      <QuoteBasketCreateCard
        loading={loading}
        strings={strings}
        onCreated={loadProfiles}
      />
      <QuoteBasketProfilesList
        profiles={profiles}
        loading={loading}
        strings={strings}
      />
    </div>
  );
}
