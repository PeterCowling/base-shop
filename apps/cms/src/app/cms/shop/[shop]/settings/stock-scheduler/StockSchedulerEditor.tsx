"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { updateStockScheduler } from "@cms/actions/shops.server";
import { useState, type ChangeEvent, type FormEvent } from "react";

interface HistoryEntry {
  runAt: number;
  alertCount: number;
}

interface Props {
  shop: string;
  initialInterval: number;
  history: HistoryEntry[];
}

export default function StockSchedulerEditor({ shop, initialInterval, history }: Props) {
  const [intervalMinutes, setIntervalMinutes] = useState(String(initialInterval));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIntervalMinutes(e.target.value);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateStockScheduler(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.settings?.stockCheckService) {
      setIntervalMinutes(String(result.settings.stockCheckService.intervalMinutes));
      setErrors({});
    }
    setSaving(false);
  };

  const sorted = history.slice().sort((a, b) => b.runAt - a.runAt);
  const lastRun = sorted[0]?.runAt;

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit} className="grid max-w-sm gap-4">
        <label className="flex flex-col gap-1">
          <span>Interval (minutes)</span>
          <Input
            type="number"
            name="intervalMinutes"
            value={intervalMinutes}
            onChange={onChange}
          />
          {errors.intervalMinutes && (
            <span className="text-sm text-red-600">
              {errors.intervalMinutes.join("; ")}
            </span>
          )}
        </label>
        <Button className="bg-primary text-white" disabled={saving} type="submit">
          {saving ? "Saving…" : "Save"}
        </Button>
      </form>

      <div>
        <p className="mb-2">Last run: {lastRun ? new Date(lastRun).toLocaleString() : "Never"}</p>
        <h3 className="mb-2 font-semibold">History</h3>
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1">Run Time</th>
              <th className="px-2 py-1">Alerts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-2 py-1 text-center text-muted">
                  No history
                </td>
              </tr>
            ) : (
              sorted.map((h, idx) => (
                <tr key={h.runAt + String(idx)}>
                  <td className="px-2 py-1">
                    {new Date(h.runAt).toLocaleString()}
                  </td>
                  <td className="px-2 py-1">{h.alertCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
