"use client";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useStepCompletion from "../hooks/useStepCompletion";

interface Props {
  shopId: string;
  payment: string[];
  setPayment: React.Dispatch<React.SetStateAction<string[]>>;
  shipping: string[];
  setShipping: React.Dispatch<React.SetStateAction<string[]>>;
  analyticsProvider: string;
  setAnalyticsProvider: (v: string) => void;
  analyticsId: string;
  setAnalyticsId: (v: string) => void;
}

export default function StepOptions({
  shopId,
  payment,
  setPayment,
  shipping,
  setShipping,
  analyticsProvider,
  setAnalyticsProvider,
  analyticsId,
  setAnalyticsId,
}: Props): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, markComplete] = useStepCompletion("options");

  useEffect(() => {
    const provider = searchParams.get("connected");
    if (!provider) return;

    if (["stripe", "paypal"].includes(provider) && !payment.includes(provider)) {
      setPayment((l) => [...l, provider]);
    }
    if (["dhl", "ups"].includes(provider) && !shipping.includes(provider)) {
      setShipping((l) => [...l, provider]);
    }

    router.replace("/cms/wizard");
  }, [searchParams, payment, shipping, router, setPayment, setShipping]);

  function connect(provider: string) {
    const url = `/cms/api/providers/${provider}?shop=${encodeURIComponent(shopId)}`;
    window.location.href = url;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Options</h2>
      <p className="text-sm text-muted-foreground">
        Provider integrations require their plugins to be installed under
        <code>packages/plugins</code>. After connecting you can configure each
        plugin from <strong>CMS → Plugins</strong>.
      </p>
      <div>
        <p className="font-medium">Payment Providers</p>
        <div className="flex items-center gap-2 text-sm">
          Stripe
          {payment.includes("stripe") ? (
            <Button disabled>Connected</Button>
          ) : (
            <Button onClick={() => connect("stripe")}>Connect</Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          PayPal
          {payment.includes("paypal") ? (
            <Button disabled>Connected</Button>
          ) : (
            <Button onClick={() => connect("paypal")}>Connect</Button>
          )}
        </div>
      </div>
      <div>
        <p className="font-medium">Shipping Providers</p>
        <div className="flex items-center gap-2 text-sm">
          DHL
          {shipping.includes("dhl") ? (
            <Button disabled>Connected</Button>
          ) : (
            <Button onClick={() => connect("dhl")}>Connect</Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          UPS
          {shipping.includes("ups") ? (
            <Button disabled>Connected</Button>
          ) : (
            <Button onClick={() => connect("ups")}>Connect</Button>
          )}
        </div>
      </div>
      <div>
        <p className="font-medium">Analytics</p>
        <Select
          value={analyticsProvider}
          onValueChange={(v) => setAnalyticsProvider(v === "none" ? "" : v)}
        >
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
      <div className="flex justify-end">
        <Button
          onClick={() => {
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          Save & return
        </Button>
      </div>
    </div>
  );
}
