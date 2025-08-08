"use client";

import { Button, Textarea } from "@/components/atoms-shadcn";
import { pricingSchema, type PricingMatrix } from "@types";
import { FormEvent, useState } from "react";

interface Props {
  shop: string;
  initial: PricingMatrix;
}

export default function PricingForm({ shop, initial }: Props) {
  const [text, setText] = useState(
    () => JSON.stringify(initial, null, 2)
  );
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const json = JSON.parse(text);
      const parsed = pricingSchema.safeParse(json);
      if (!parsed.success) {
        setStatus("error");
        setError(parsed.error.issues.map((i) => i.message).join(", "));
        return;
      }
      setStatus("saved");
      setError(null);
      const res = await fetch(`/api/data/${shop}/rental/pricing`, {
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
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
      />
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
