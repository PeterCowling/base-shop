"use client";

import { useEffect, useMemo, useState } from "react";
import type { TelemetryEvent } from "@acme/telemetry";
import { LineChart } from "@acme/ui";

export default function TelemetryPage() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const endpoint =
          process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT ?? "/api/telemetry";
        const res = await fetch(endpoint);
        if (!res.ok) return;
        const data = (await res.json()) as TelemetryEvent[];
        setEvents(Array.isArray(data) ? data : []);
      } catch {
        // ignore fetch errors
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const startTs = start ? new Date(start).getTime() : 0;
    const endTs = end ? new Date(end).getTime() : Number.MAX_SAFE_INTEGER;
    return events.filter(
      (e) =>
        (!name || e.name.includes(name)) &&
        e.ts >= startTs &&
        e.ts <= endTs
    );
  }, [events, name, start, end]);

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of filtered) {
      counts.set(e.name, (counts.get(e.name) ?? 0) + 1);
    }
    const labels = Array.from(counts.keys());
    return {
      labels,
      datasets: [
        {
          label: "Event count",
          data: labels.map((l) => counts.get(l) ?? 0),
          borderColor: "rgb(75, 192, 192)",
        },
      ],
    };
  }, [filtered]);

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Telemetry Events</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Event name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border px-2 py-1"
        />
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded border px-2 py-1"
        />
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded border px-2 py-1"
        />
      </div>
      {filtered.length > 0 && (
        <LineChart data={chartData} className="max-w-xl" />
      )}
      <ul className="mt-4 space-y-1">
        {filtered.map((e, i) => (
          <li key={i} className="text-sm">
            {new Date(e.ts).toLocaleString()} — {e.name}
          </li>
        ))}
        {filtered.length === 0 && <li className="text-sm">No events found.</li>}
      </ul>
    </div>
  );
}

