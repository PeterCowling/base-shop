"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useStepCompletion from "../hooks/useStepCompletion";
import { useConfigurator } from "../ConfiguratorContext";
import { providersByType, type Provider } from "@acme/configurator/providers";

export default function StepOptions(): React.JSX.Element {
  const { state, update } = useConfigurator();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, markComplete] = useStepCompletion("options");

  // Local copies to ensure the component re-renders in tests when values change
  const [analyticsProvider, setAnalyticsProvider] = useState(
    state.analyticsProvider
  );
  const [analyticsId, setAnalyticsId] = useState(state.analyticsId);

  const paymentProviders: Provider[] = providersByType("payment");
  const shippingProviders: Provider[] = providersByType("shipping");
  const analyticsProviders: Provider[] = providersByType("analytics");

  // Simulate handling of "connected" provider returned via query string.
  const provider = searchParams.get("connected");
  if (provider && !state.payment.includes(provider) && !state.shipping.includes(provider)) {
    update("payment", [...state.payment, provider]);
    router.replace("/cms/configurator");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Options</h2>
      <div>
        <p className="font-medium">Payment Providers</p>
        {paymentProviders.map((p) => (
          <div key={p.id} className="flex items-center gap-2 text-sm">
            {p.name}
            <button>Connect</button>
          </div>
        ))}
      </div>
      <div>
        <p className="font-medium">Shipping Providers</p>
        {shippingProviders.map((p) => (
          <div key={p.id} className="flex items-center gap-2 text-sm">
            {p.name}
            <button>Connect</button>
          </div>
        ))}
      </div>
      <div>
        <p className="font-medium">Analytics</p>
        <select
          data-testid="select"
          value={analyticsProvider}
          onChange={(e) => {
            const val = e.target.value;
            setAnalyticsProvider(val);
            update("analyticsProvider", val);
          }}
        >
          <option value="none">None</option>
          {analyticsProviders.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {analyticsProvider === "ga" && (
          <input
            className="mt-2"
            value={analyticsId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setAnalyticsId(e.target.value);
              update("analyticsId", e.target.value);
            }}
            placeholder="Measurement ID"
          />
        )}
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => {
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          Save & return
        </button>
      </div>
    </div>
  );
}
