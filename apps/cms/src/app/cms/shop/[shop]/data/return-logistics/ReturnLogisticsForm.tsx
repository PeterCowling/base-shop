"use client";

import { Button, Input, Checkbox } from "@/components/atoms/shadcn";
import { returnLogisticsSchema, type ReturnLogistics } from "@acme/types";
import { FormEvent, useState } from "react";

interface Props {
  shop: string;
  initial: ReturnLogistics;
}

export default function ReturnLogisticsForm({ shop, initial }: Props) {
  const [form, setForm] = useState<ReturnLogistics>(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = returnLogisticsSchema.safeParse(form);
    if (!parsed.success) {
      setStatus("error");
      setError(parsed.error.issues.map((i) => i.message).join(", "));
      return;
    }
    try {
      setStatus("saved");
      setError(null);
      const res = await fetch(`/api/data/${shop}/return-logistics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus("error");
        setError(body.error || "Failed to save");
      }
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="flex flex-col gap-1">
        <span>Label Service</span>
        <Input
          value={form.labelService}
          onChange={(e) =>
            setForm((f) => ({ ...f, labelService: e.target.value }))
          }
        />
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={form.inStore}
          onCheckedChange={(v) =>
            setForm((f) => ({ ...f, inStore: Boolean(v) }))
          }
        />
        <span>Allow in-store returns</span>
      </label>
      <label className="flex flex-col gap-1">
        <span>Drop-off Provider</span>
        <Input
          value={form.dropOffProvider ?? ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              dropOffProvider: e.target.value || undefined,
            }))
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Bag Type</span>
        <Input
          value={form.bagType}
          onChange={(e) =>
            setForm((f) => ({ ...f, bagType: e.target.value }))
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Return Carriers (comma separated)</span>
        <Input
          value={form.returnCarrier.join(", ")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              returnCarrier: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }))
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Home Pickup ZIPs (comma separated)</span>
        <Input
          value={form.homePickupZipCodes.join(", ")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              homePickupZipCodes: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }))
          }
        />
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={Boolean(form.tracking)}
          onCheckedChange={(v) =>
            setForm((f) => ({ ...f, tracking: Boolean(v) }))
          }
        />
        <span>Enable tracking numbers</span>
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={form.requireTags}
          onCheckedChange={(v) =>
            setForm((f) => ({ ...f, requireTags: Boolean(v) }))
          }
        />
        <span>Require tags for returns</span>
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={form.allowWear}
          onCheckedChange={(v) =>
            setForm((f) => ({ ...f, allowWear: Boolean(v) }))
          }
        />
        <span>Allow signs of wear</span>
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={Boolean(form.mobileApp)}
          onCheckedChange={(v) =>
            setForm((f) => ({ ...f, mobileApp: Boolean(v) }))
          }
        />
        <span>Enable mobile returns</span>
      </label>
      {status === "saved" && (
        <p className="text-sm text-green-600">Saved!</p>
      )}
      {status === "error" && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <Button type="submit">Save</Button>
    </form>
  );
}
