"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { type Provider,providersByType } from "@acme/configurator/providers";
import { Cluster,Inline } from "@acme/design-system/primitives";
import { useTranslations } from "@acme/i18n";

import { Button } from "@/components/atoms/shadcn";
import type { ConfiguratorStepProps } from "@/types/configurator";

import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";

export default function StepShipping(_: ConfiguratorStepProps): React.JSX.Element {
  const t = useTranslations();
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold" data-tour="quest-shipping">
            {t("cms.configurator.shipping.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("cms.configurator.shipping.description")}{" "}
            <code>{t("cms.configurator.options.info.path")}</code>.
          </p>
        </div>
        <div className="rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning-foreground">
          {t("cms.configurator.time.badge.shipping")}
        </div>
      </div>
      <div>
        <p className="font-medium">{t("cms.configurator.options.shippingProviders")}</p>
        {shippingProviders.map((p: Provider) => (
          <Inline key={p.id} gap={2} alignY="center" className="text-sm">
            {/* i18n-exempt -- ABC-123 [ttl=2099-12-31] */}
            {p.name}
            {shipping.includes(p.id) ? (
              <Button disabled data-cy={`shipping-connected-${p.id}`}>
                {t("cms.configurator.options.connected")}
              </Button>
            ) : (
              <Button data-cy={`shipping-connect-${p.id}`} onClick={() => connect(p.id)}>
                {t("cms.configurator.options.connect")}
              </Button>
            )}
          </Inline>
        ))}
      </div>
      <Cluster justify="end">
        <Button
          data-cy="save-return"
          onClick={() => {
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          {t("cms.configurator.actions.saveReturn")}
        </Button>
      </Cluster>
    </div>
  );
}
