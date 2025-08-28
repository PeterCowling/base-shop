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
import { useCallback, useEffect, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";
import { providersByType, type Provider } from "@acme/configurator/providers";

export default function StepOptions(): React.JSX.Element {
  const { state, update } = useConfigurator();
  const {
    shopId,
    payment,
    shipping,
    analyticsProvider,
    analyticsId,
  } = state;
  const setPayment = useCallback((v: string[]) => update("payment", v), [update]);
  const setShipping = useCallback((v: string[]) => update("shipping", v), [update]);
  const setAnalyticsProvider = useCallback(
    (v: string) => update("analyticsProvider", v),
    [update],
  );
  const setAnalyticsId = useCallback((v: string) => update("analyticsId", v), [update]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [, markComplete] = useStepCompletion("options");

  const paymentProviders: Provider[] = providersByType("payment");
  const paymentIds = paymentProviders.map((p: Provider) => p.id);
  const shippingProviders: Provider[] = providersByType("shipping");
  const shippingIds = shippingProviders.map((p: Provider) => p.id);
  const analyticsProviders: Provider[] = providersByType("analytics");

  useEffect(() => {
    const provider = searchParams.get("connected");
    if (!provider) return;

    if (paymentIds.includes(provider) && !payment.includes(provider)) {
      setPayment([...payment, provider]);
    }
    if (shippingIds.includes(provider) && !shipping.includes(provider)) {
      setShipping([...shipping, provider]);
    }

    router.replace("/cms/configurator");
  }, [
    searchParams,
    paymentIds,
    shippingIds,
    payment,
    shipping,
    setPayment,
    setShipping,
    router,
  ]);

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
        {paymentProviders.map((p: Provider) => (
          <div key={p.id} className="flex items-center gap-2 text-sm">
            {p.name}
            {payment.includes(p.id) ? (
              <Button disabled>Connected</Button>
            ) : (
              <Button onClick={() => connect(p.id)}>Connect</Button>
            )}
          </div>
        ))}
      </div>
      <div>
        <p className="font-medium">Shipping Providers</p>
        {shippingProviders.map((p: Provider) => (
          <div key={p.id} className="flex items-center gap-2 text-sm">
            {p.name}
            {shipping.includes(p.id) ? (
              <Button disabled>Connected</Button>
            ) : (
              <Button onClick={() => connect(p.id)}>Connect</Button>
            )}
          </div>
        ))}
      </div>
      <div>
        <p className="font-medium">Analytics</p>
        <Select
          value={analyticsProvider}
          onValueChange={(v: string) =>
            setAnalyticsProvider(v === "none" ? "" : v)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {analyticsProviders.map((p: Provider) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {analyticsProvider === "ga" && (
          <Input
            className="mt-2"
            value={analyticsId}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setAnalyticsId(e.target.value)
            }
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
