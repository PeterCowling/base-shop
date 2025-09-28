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
import { Inline, Cluster } from "@ui/components/atoms/primitives";
import { useTranslations } from "@acme/i18n";

export default function StepOptions(_: ConfiguratorStepProps): React.JSX.Element {
  const t = useTranslations();
  const { state, update } = useConfigurator();
  const { shopId, payment, shipping, analyticsProvider, analyticsId } = state;
  const setPayment = useCallback((v: string[]) => update("payment", v), [update]);
  const setShipping = useCallback((v: string[]) => update("shipping", v), [update]);
  const setAnalyticsProvider = useCallback(
    (v: string) => update("analyticsProvider", v),
    [update],
  );
  const setAnalyticsId = useCallback((v: string) => update("analyticsId", v), [update]);

  const [selectedAnalyticsProvider, setSelectedAnalyticsProvider] =
    useState(analyticsProvider);
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
  const [, markComplete] = useStepCompletion("options");
  // i18n-exempt -- ABC-123 [ttl=2099-12-31] data-cy tokens for testing only
  const CY_ANALYTICS_PROVIDER = "analytics-provider";

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
      <h2 className="text-xl font-semibold">{t("cms.configurator.options.title")}</h2>
      <p className="text-sm text-muted-foreground">
        {t("cms.configurator.options.info.beforePath")} <code>{t("cms.configurator.options.info.path")}</code>. {t("cms.configurator.options.info.afterPathBeforeMenu")} <strong>{t("cms.configurator.options.info.menu")}</strong>.
      </p>
      <div>
        <p className="font-medium">{t("cms.configurator.payment.providers.label")}</p>
        {paymentProviders.map((p: Provider) => (
          <Inline key={p.id} gap={2} alignY="center" className="text-sm">
            {/* i18n-exempt -- ABC-123 [ttl=2099-12-31] */}
            {p.name}
            {payment.includes(p.id) ? (
              <Button disabled data-cy={`payment-connected-${p.id}`}>
                {t("cms.configurator.payment.connected")}
              </Button>
            ) : (
              <Button
                data-cy={`payment-connect-${p.id}`}
                onClick={() => connect(p.id)}
              >
                {t("cms.configurator.payment.connect")}
              </Button>
            )}
          </Inline>
        ))}
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
              <Button
                data-cy={`shipping-connect-${p.id}`}
                onClick={() => connect(p.id)}
              >
                {t("cms.configurator.options.connect")}
              </Button>
            )}
          </Inline>
        ))}
      </div>
      <div>
        <p className="font-medium">{t("cms.configurator.analytics.label")}</p>
        <Select
          data-cy={CY_ANALYTICS_PROVIDER}
          value={selectedAnalyticsProvider}
          onValueChange={handleAnalyticsProviderChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("cms.configurator.analytics.selectProvider")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("cms.configurator.analytics.none")}</SelectItem>
            {analyticsProviders.map((p: Provider) => (
              <SelectItem key={p.id} value={p.id}>
                {/* i18n-exempt -- ABC-123 [ttl=2099-12-31] */}
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
            placeholder={t("cms.configurator.analytics.measurementId") as string}
          />
        )}
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
