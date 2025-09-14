"use client";

// apps/cms/src/app/cms/shop/[shop]/settings/stock-scheduler/StockSchedulerEditor.tsx

import { Button, Input } from "@/components/atoms/shadcn";
import { updateStockScheduler } from "@cms/actions/stockScheduler.server";
import { useState, type FormEvent, type ChangeEvent } from "react";

interface HistoryEntry {
  timestamp: number;
  alerts: number;
}

interface Props {
  shop: string;
  status: { intervalMs: number; lastRun?: number; history: HistoryEntry[] };
}

export default function StockSchedulerEditor({ shop, status }: Props) {
  const [interval, setInterval] = useState(String(status.intervalMs));
  const [saving, setSaving] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInterval(e.target.value);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await updateStockScheduler(shop, fd);
    setSaving(false);
  };

  return (
    <div className="grid max-w-md gap-4">
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="flex flex-col gap-1">
          <span>Check Interval (ms)</span>
          <Input
            type="number"
            name="intervalMs"
            value={interval}
            onChange={handleChange}
          />
        </label>
        <Button className="bg-primary text-white" disabled={saving} type="submit">
          {saving ? "Saving…" : "Save"}
        </Button>
      </form>
      <div>
        <p className="text-sm">
          Last run: {status.lastRun ? new Date(status.lastRun).toLocaleString() : "never"}
        </p>
      </div>
      <div>
        <h3 className="mt-4 font-medium">Recent Checks</h3>
        {status.history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No checks yet.</p>
        ) : (
          <table className="mt-2 text-sm">
            <thead>
              <tr>
                <th className="pr-4 text-left">Time</th>
                <th className="text-left">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {status.history
                .slice()
                .reverse()
                .map((h) => (
                  <tr key={h.timestamp}>
                    <td className="pr-4">
                      {new Date(h.timestamp).toLocaleString()}
                    </td>
                    <td>{h.alerts}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
