"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Alert, Tag } from "@acme/design-system/atoms";
import { Grid, Inline, Stack } from "@acme/design-system/primitives";
import { Button } from "@acme/design-system/shadcn";
import { cn } from "@acme/design-system/utils/style";
import { useTranslations } from "@acme/i18n";
import type { ProviderTemplate } from "@acme/templates";

import { useConfigurator } from "../../ConfiguratorContext";
import useStepCompletion from "../../hooks/useStepCompletion";
import { useRapidLaunchDefaultsContext } from "../RapidLaunchDefaultsContext";
import type { RapidLaunchStepProps } from "../types";

function TemplateCard({
  template,
  selected,
  onSelect,
  selectedLabel,
}: {
  template: ProviderTemplate;
  selected: boolean;
  onSelect: (id: string) => void;
  selectedLabel: string;
}) {
  return (
    <Stack
      asChild
      gap={3}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition",
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
      )}
    >
      <button type="button" onClick={() => onSelect(template.id)}>
        <Inline alignY="start" gap={3} className="justify-between">
        <div>
          <div className="text-sm font-semibold">{template.label}</div>
          <p className="text-xs text-muted-foreground">{template.description}</p>
        </div>
        {selected ? <Tag variant="success">{selectedLabel}</Tag> : null}
        </Inline>
        <Inline gap={2}>
        {template.capabilities.slice(0, 4).map((cap) => (
          <Tag key={cap} variant="default">
            {cap}
          </Tag>
        ))}
        {template.capabilities.length > 4 && (
          <Tag variant="default">+{template.capabilities.length - 4}</Tag>
        )}
        </Inline>
      </button>
    </Stack>
  );
}

export default function StepCommerceTemplates({
  prevStepId,
  nextStepId,
}: RapidLaunchStepProps): React.JSX.Element {
  const t = useTranslations();
  const router = useRouter();
  const { state, update } = useConfigurator();
  const { data, loading, error } = useRapidLaunchDefaultsContext();
  const [, markComplete] = useStepCompletion("commerce");

  const paymentTemplates = useMemo(
    () => data?.options.paymentTemplates ?? [],
    [data?.options.paymentTemplates]
  );
  const shippingTemplates = useMemo(
    () => data?.options.shippingTemplates ?? [],
    [data?.options.shippingTemplates]
  );
  const taxTemplates = useMemo(
    () => data?.options.taxTemplates ?? [],
    [data?.options.taxTemplates]
  );

  const selectedPayment = state.paymentTemplateId;
  const selectedShipping = state.shippingTemplateId;
  const selectedTax = state.taxTemplateId;

  const canContinue =
    Boolean(selectedPayment) && Boolean(selectedShipping) && Boolean(selectedTax);

  const paymentTemplateById = useMemo(
    () => new Map(paymentTemplates.map((t) => [t.id, t])),
    [paymentTemplates]
  );
  const shippingTemplateById = useMemo(
    () => new Map(shippingTemplates.map((t) => [t.id, t])),
    [shippingTemplates]
  );

  const handleSelectPayment = (id: string) => {
    update("paymentTemplateId", id);
    const template = paymentTemplateById.get(id);
    if (template?.provider) {
      update("payment", [template.provider]);
      update("billingProvider", template.provider);
    }
  };

  const handleSelectShipping = (id: string) => {
    update("shippingTemplateId", id);
    const template = shippingTemplateById.get(id);
    if (template?.provider) {
      update("shipping", [template.provider]);
    }
  };

  const handleSelectTax = (id: string) => {
    update("taxTemplateId", id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {t("cms.rapidLaunch.commerce.heading")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("cms.rapidLaunch.commerce.subheading")}
        </p>
      </div>

      {error && <Alert variant="warning" tone="soft" heading={error} />}

      <section className="space-y-3">
        <Inline alignY="center" gap={3} className="justify-between">
          <h3 className="text-sm font-semibold">
            {t("cms.rapidLaunch.commerce.payment.heading")}
          </h3>
          {loading && (
            <span className="text-xs text-muted-foreground">
              {t("cms.rapidLaunch.commerce.loading")}
            </span>
          )}
        </Inline>
        <Grid cols={1} gap={3} className="md:grid-cols-2">
          {paymentTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={template.id === selectedPayment}
              onSelect={handleSelectPayment}
              selectedLabel={t("cms.rapidLaunch.common.selected") as string}
            />
          ))}
        </Grid>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">
          {t("cms.rapidLaunch.commerce.shipping.heading")}
        </h3>
        <Grid cols={1} gap={3} className="md:grid-cols-2">
          {shippingTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={template.id === selectedShipping}
              onSelect={handleSelectShipping}
              selectedLabel={t("cms.rapidLaunch.common.selected") as string}
            />
          ))}
        </Grid>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">
          {t("cms.rapidLaunch.commerce.tax.heading")}
        </h3>
        <Grid cols={1} gap={3} className="md:grid-cols-2">
          {taxTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={template.id === selectedTax}
              onSelect={handleSelectTax}
              selectedLabel={t("cms.rapidLaunch.common.selected") as string}
            />
          ))}
        </Grid>
      </section>

      <Inline gap={3} className="justify-between">
        {prevStepId ? (
          <Button variant="outline" onClick={() => router.push(`/cms/configurator/rapid-launch/${prevStepId}`)}>
            {t("wizard.back")}
          </Button>
        ) : (
          <span />
        )}
        {nextStepId && (
          <Button
            onClick={() => {
              markComplete(true);
              router.push(`/cms/configurator/rapid-launch/${nextStepId}`);
            }}
            disabled={!canContinue}
          >
            {t("wizard.next")}
          </Button>
        )}
      </Inline>
    </div>
  );
}
