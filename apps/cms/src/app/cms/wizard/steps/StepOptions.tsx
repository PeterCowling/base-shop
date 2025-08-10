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
} from "@ui";
import { toggle } from "../listUtils";

interface Props {
  payment: string[];
  setPayment: React.Dispatch<React.SetStateAction<string[]>>;
  shipping: string[];
  setShipping: React.Dispatch<React.SetStateAction<string[]>>;
  analyticsProvider: string;
  setAnalyticsProvider: (v: string) => void;
  analyticsId: string;
  setAnalyticsId: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepOptions({
  payment,
  setPayment,
  shipping,
  setShipping,
  analyticsProvider,
  setAnalyticsProvider,
  analyticsId,
  setAnalyticsId,
  onBack,
  onNext,
}: Props): React.JSX.Element {
  return (
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
      <div>
        <p className="font-medium">Analytics</p>
        <Select
          value={analyticsProvider}
          onValueChange={(v) => setAnalyticsProvider(v === "none" ? "" : v)}
        >
          {" "}
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="ga">Google Analytics</SelectItem>
          </SelectContent>
        </Select>
        {analyticsProvider === "ga" && (
          <Input
            className="mt-2"
            value={analyticsId}
            onChange={(e) => setAnalyticsId(e.target.value)}
            placeholder="Measurement ID"
          />
        )}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}
