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
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";
import { providersByType, type Provider } from "@acme/configurator/providers";
import type { ConfiguratorStepProps } from "@/types/configurator";

export default function StepPaymentProvider(_: ConfiguratorStepProps): React.JSX.Element {
  const { state, update } = useConfigurator();
  const { shopId, payment, analyticsProvider, analyticsId } = state;

  const setPayment = useCallback((v: string[]) => update("payment", v), [update]);
  const setAnalyticsProvider = useCallback(
    (v: string) => update("analyticsProvider", v),
    [update],
  );
  const setAnalyticsId = useCallback((v: string) => update("analyticsId", v), [update]);

  const [selectedAnalyticsProvider, setSelectedAnalyticsProvider] = useState(analyticsProvider);
  const [analyticsIdValue, setAnalyticsIdValue] = useState(analyticsId);

  const handleAnalyticsProviderChange = useCallback(
    (v: string) => {
      const val = v === "none" ? "" : v;
      setSelectedAnalyticsProvider(val);
      setAnalyticsProvider(val);
    },
    [setAnalyticsProvider],
  );

  const handleAnalyticsIdChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setAnalyticsIdValue(e.target.value);
      setAnalyticsId(e.target.value);
    },
    [setAnalyticsId],
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const [, markComplete] = useStepCompletion("payment-provider");

  const paymentProviders: Provider[] = providersByType("payment");
  const paymentIds = paymentProviders.map((p: Provider) => p.id);
  const analyticsProviders: Provider[] = providersByType("analytics");

  useEffect(() => {
    const provider = searchParams.get("connected");
    if (!provider) return;

    if (paymentIds.includes(provider) && !payment.includes(provider)) {
      setPayment([...payment, provider]);
    }

    router.replace("/cms/configurator");
  }, [searchParams, paymentIds, payment, setPayment, router]);

  function connect(provider: string) {
    const url = `/cms/api/providers/${provider}?shop=${encodeURIComponent(shopId)}`;
    window.location.href = url;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Payment Provider</h2>
      <p className="text-sm text-muted-foreground">
        Connect payment gateways and set up basic analytics for conversions. Provider integrations
        require their plugins to be installed under <code>packages/plugins</code>.
      </p>
      <div>
        <p className="font-medium">Payment Providers</p>
        {paymentProviders.map((p: Provider) => (
          <div key={p.id} className="flex items-center gap-2 text-sm">
            {p.name}
            {payment.includes(p.id) ? (
              <Button disabled data-cy={`payment-connected-${p.id}`}>
                Connected
              </Button>
            ) : (
              <Button data-cy={`payment-connect-${p.id}`} onClick={() => connect(p.id)}>
                Connect
              </Button>
            )}
          </div>
        ))}
      </div>

      <div>
        <p className="font-medium">Analytics</p>
        <Select data-cy="analytics-provider" value={selectedAnalyticsProvider} onValueChange={handleAnalyticsProviderChange}>
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
        {selectedAnalyticsProvider === "ga" && (
          <Input
            data-cy="analytics-id"
            className="mt-2"
            value={analyticsIdValue}
            onChange={handleAnalyticsIdChange}
            placeholder="Measurement ID"
          />
        )}
      </div>

      <div className="flex justify-end">
        <Button
          data-cy="save-return"
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

