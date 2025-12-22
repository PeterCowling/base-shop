"use client";

import { useCallback, useEffect, useState } from "react";
import LaneCreateCard from "./LaneCreateCard";
import LanesList from "./LanesList";
import type { LaneSummary, LogisticsStrings } from "./types";

export default function LogisticsLanesClient({
  strings,
}: {
  strings: LogisticsStrings;
}) {
  const [lanes, setLanes] = useState<LaneSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLanes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/logistics/lanes?limit=50");
      if (!response.ok) return;
      const data = (await response.json()) as {
        ok?: boolean;
        lanes?: LaneSummary[];
      };
      if (data.ok && Array.isArray(data.lanes)) {
        setLanes(data.lanes);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLanes();
  }, [loadLanes]);

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-border-1 bg-surface-2 p-4 text-sm text-foreground/70">
        <div className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.help.label}
        </div>
        <div className="mt-2 font-semibold">{strings.help.title}</div>
        <p className="mt-2 text-sm text-foreground/70">{strings.help.body}</p>
      </div>
      <LaneCreateCard loading={loading} strings={strings} onCreated={loadLanes} />
      <LanesList lanes={lanes} loading={loading} strings={strings} />
    </div>
  );
}
