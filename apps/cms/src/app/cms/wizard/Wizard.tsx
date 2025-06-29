"use client";

import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms-shadcn";
import { tokens as abcTokens } from "@themes/abc/tailwind-tokens";
import { tokens as baseTokensSrc } from "@themes/base/tokens";
import { tokens as bcdTokens } from "@themes/bcd/tailwind-tokens";
import { tokens as brandxTokens } from "@themes/brandx/tailwind-tokens";
import { tokens as darkTokens } from "@themes/dark/tailwind-tokens";
import { useMemo, useState } from "react";

interface Props {
  themes: string[];
  templates: string[];
}

type TokenMap = Record<`--${string}`, string>;

const baseTokens: TokenMap = Object.fromEntries(
  Object.entries(baseTokensSrc).map(([k, v]) => [k, v.light])
) as TokenMap;

const themeTokenMap: Record<string, TokenMap> = {
  base: baseTokens,
  abc: abcTokens,
  bcd: bcdTokens,
  brandx: brandxTokens,
  dark: darkTokens,
};

export default function Wizard({ themes, templates }: Props) {
  const [step, setStep] = useState(0);
  const [shopId, setShopId] = useState("");
  const [template, setTemplate] = useState(templates[0] ?? "");
  const [theme, setTheme] = useState(themes[0] ?? "");
  const [payment, setPayment] = useState<string[]>([]);
  const [shipping, setShipping] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const themeVars = useMemo(() => themeTokenMap[theme] ?? baseTokens, [theme]);

  function toggle(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  async function submit() {
    setCreating(true);
    setResult(null);
    try {
      const res = await fetch("/cms/api/create-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: shopId,
          template,
          theme,
          payment,
          shipping,
        }),
      });
      if (res.ok) {
        setResult("Shop created successfully");
      } else {
        setResult("Failed to create shop");
      }
    } catch {
      setResult("Failed to create shop");
    }
    setCreating(false);
  }

  const themeStyle = Object.fromEntries(
    Object.entries(themeVars).map(([k, v]) => [k, v])
  ) as React.CSSProperties;

  return (
    <div className="mx-auto max-w-xl space-y-6" style={themeStyle}>
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Shop Details</h2>
          <label className="flex flex-col gap-1">
            <span>Shop ID</span>
            <Input
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              placeholder="my-shop"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Template</span>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="flex justify-end gap-2">
            <Button disabled={!shopId} onClick={() => setStep(1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select Theme</h2>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              {themes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="rounded border p-4">
            <p className="text-primary">Preview text</p>
            <p className="text-muted">Background uses theme tokens</p>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button onClick={() => setStep(2)}>Next</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Options</h2>
          <div>
            <p className="font-medium">Payment Providers</p>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={payment.includes("stripe")}
                onCheckedChange={() => setPayment((l) => toggle(l, "stripe"))}
              />
              Stripe
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={payment.includes("paypal")}
                onCheckedChange={() => setPayment((l) => toggle(l, "paypal"))}
              />
              PayPal
            </label>
          </div>
          <div>
            <p className="font-medium">Shipping Providers</p>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={shipping.includes("dhl")}
                onCheckedChange={() => setShipping((l) => toggle(l, "dhl"))}
              />
              DHL
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={shipping.includes("ups")}
                onCheckedChange={() => setShipping((l) => toggle(l, "ups"))}
              />
              UPS
            </label>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Summary</h2>
          <ul className="list-disc pl-5 text-sm">
            <li>
              <b>Shop ID:</b> {shopId}
            </li>
            <li>
              <b>Template:</b> {template}
            </li>
            <li>
              <b>Theme:</b> {theme}
            </li>
            <li>
              <b>Payment:</b> {payment.join(", ") || "none"}
            </li>
            <li>
              <b>Shipping:</b> {shipping.join(", ") || "none"}
            </li>
          </ul>
          {result && <p className="text-sm">{result}</p>}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button disabled={creating} onClick={submit}>
              {creating ? "Creating…" : "Create Shop"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
