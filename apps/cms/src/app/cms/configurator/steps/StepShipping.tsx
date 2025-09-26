"use client";

import { Button } from "@/components/atoms/shadcn";
import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";
import { providersByType, type Provider } from "@acme/configurator/providers";
import type { ConfiguratorStepProps } from "@/types/configurator";

export default function StepShipping(_: ConfiguratorStepProps): React.JSX.Element {
  const { state, update } = useConfigurator();
  const { shopId, shipping } = state;
  const setShipping = useCallback((v: string[]) => update("shipping", v), [update]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [, markComplete] = useStepCompletion("shipping");

  const shippingProviders: Provider[] = providersByType("shipping");
  const shippingIds = shippingProviders.map((p: Provider) => p.id);

  useEffect(() => {
    const provider = searchParams.get("connected");
    if (!provider) return;

    if (shippingIds.includes(provider) && !shipping.includes(provider)) {
      setShipping([...shipping, provider]);
    }

    router.replace("/cms/configurator");
  }, [searchParams, shippingIds, shipping, setShipping, router]);

  function connect(provider: string) {
    const url = `/cms/api/providers/${provider}?shop=${encodeURIComponent(shopId)}`;
    window.location.href = url;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Shipping</h2>
      <p className="text-sm text-muted-foreground">
        Connect your shipping providers. Provider integrations require their plugins to be installed under
        <code> packages/plugins</code>.
      </p>
      <div>
        <p className="font-medium">Shipping Providers</p>
        {shippingProviders.map((p: Provider) => (
          <div key={p.id} className="flex items-center gap-2 text-sm">
            {p.name}
            {shipping.includes(p.id) ? (
              <Button disabled data-cy={`shipping-connected-${p.id}`}>
                Connected
              </Button>
            ) : (
              <Button data-cy={`shipping-connect-${p.id}`} onClick={() => connect(p.id)}>
                Connect
              </Button>
            )}
          </div>
        ))}
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

