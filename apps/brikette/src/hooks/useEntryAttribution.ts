"use client";

import { useEffect, useState } from "react";

import {
  type EntryAttributionPayload,
  readAttribution,
} from "@/utils/entryAttribution";

export function useEntryAttribution(): EntryAttributionPayload | null {
  const [attribution, setAttribution] = useState<EntryAttributionPayload | null>(null);

  useEffect(() => {
    setAttribution(readAttribution());
  }, []);

  return attribution;
}
