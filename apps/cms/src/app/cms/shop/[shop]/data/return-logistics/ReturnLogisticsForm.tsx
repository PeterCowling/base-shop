"use client";

import { Button, Input, Checkbox } from "@acme/ui/components/atoms/shadcn";
import { returnLogisticsSchema, type ReturnLogistics } from "@acme/types";
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";

type FormState = Omit<ReturnLogistics, "returnCarrier"> & {
  returnCarrier: string[];
};

interface Props {
  shop: string;
  initial: ReturnLogistics;
}

export default function ReturnLogisticsForm({ shop, initial }: Props) {
  const [form, setForm] = useState<FormState>(() => ({
    ...initial,
    returnCarrier: initial.returnCarrier.length
      ? initial.returnCarrier
      : [""],
    homePickupZipCodes: initial.homePickupZipCodes.length
      ? initial.homePickupZipCodes
      : [""],
  }));
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = returnLogisticsSchema.safeParse({
      ...form,
      returnCarrier: form.returnCarrier.filter(Boolean),
      homePickupZipCodes: form.homePickupZipCodes.filter(Boolean),
    });
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
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((f) => ({
              ...f,
              labelService: e.target.value as FormState["labelService"],
            }))
          }
        />
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={form.inStore}
          onCheckedChange={(v: boolean) =>
            setForm((f) => ({ ...f, inStore: Boolean(v) }))
          }
        />
        <span>Allow in-store returns</span>
      </label>
      <label className="flex flex-col gap-1">
        <span>Drop-off Provider</span>
        <Input
          value={form.dropOffProvider ?? ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((f) => ({
              ...f,
              bagType: e.target.value as FormState["bagType"],
            }))
          }
        />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">Return Carriers</legend>
        {form.returnCarrier.map((carrier, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={carrier}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm((f) => {
                  const next = [...f.returnCarrier];
                  next[i] = e.target.value;
                  return { ...f, returnCarrier: next };
                })
              }
            />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  returnCarrier: f.returnCarrier.filter((_, idx) => idx !== i),
                }))
              }
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            setForm((f) => ({
              ...f,
              returnCarrier: [...f.returnCarrier, ""],
            }))
          }
        >
          Add carrier
        </Button>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">Home Pickup ZIPs</legend>
        {form.homePickupZipCodes.map((zip, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={zip}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm((f) => {
                  const next = [...f.homePickupZipCodes];
                  next[i] = e.target.value;
                  return { ...f, homePickupZipCodes: next };
                })
              }
            />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  homePickupZipCodes: f.homePickupZipCodes.filter(
                    (_, idx) => idx !== i
                  ),
                }))
              }
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            setForm((f) => ({
              ...f,
              homePickupZipCodes: [...f.homePickupZipCodes, ""],
            }))
          }
        >
          Add ZIP
        </Button>
      </fieldset>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={Boolean(form.tracking)}
          onCheckedChange={(v: boolean) =>
            setForm((f) => ({ ...f, tracking: Boolean(v) }))
          }
        />
        <span>Enable tracking numbers</span>
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={form.requireTags}
          onCheckedChange={(v: boolean) =>
            setForm((f) => ({ ...f, requireTags: Boolean(v) }))
          }
        />
        <span>Require tags for returns</span>
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={form.allowWear}
          onCheckedChange={(v: boolean) =>
            setForm((f) => ({ ...f, allowWear: Boolean(v) }))
          }
        />
        <span>Allow signs of wear</span>
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={Boolean(form.mobileApp)}
          onCheckedChange={(v: boolean) =>
            setForm((f) => ({ ...f, mobileApp: Boolean(v) }))
          }
        />
        <span>Enable mobile returns</span>
      </label>
      {status === "saved" && (
        <p className="text-sm text-success">Saved!</p>
      )}
      {status === "error" && error && (
        <p className="text-sm text-danger-foreground">{error}</p>
      )}
      <Button type="submit">Save</Button>
    </form>
  );
}
