"use client";

import { useEffect } from "react";

import { ConfiguratorProvider, useConfigurator } from "../ConfiguratorContext";

import {
  RapidLaunchDefaultsProvider,
  useRapidLaunchDefaultsContext,
} from "./RapidLaunchDefaultsContext";

function RapidLaunchDefaultsApplier({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { setState } = useConfigurator();
  const { data } = useRapidLaunchDefaultsContext();

  useEffect(() => {
    if (!data) return;

    const {
      defaults,
      options: { paymentTemplates, shippingTemplates },
    } = data;

    const paymentTemplate =
      paymentTemplates.find((t) => t.id === defaults.paymentTemplateId) ??
      paymentTemplates[0];
    const shippingTemplate =
      shippingTemplates.find((t) => t.id === defaults.shippingTemplateId) ??
      shippingTemplates[0];
    setState((prev) => {
      let changed = false;
      const next = { ...prev };

      if (!prev.theme && defaults.themeId) {
        next.theme = defaults.themeId;
        changed = true;
      }
      if (!prev.paymentTemplateId && defaults.paymentTemplateId) {
        next.paymentTemplateId = defaults.paymentTemplateId;
        changed = true;
      }
      if (!prev.shippingTemplateId && defaults.shippingTemplateId) {
        next.shippingTemplateId = defaults.shippingTemplateId;
        changed = true;
      }
      if (!prev.taxTemplateId && defaults.taxTemplateId) {
        next.taxTemplateId = defaults.taxTemplateId;
        changed = true;
      }
      if (!prev.legalBundleId && defaults.legalBundleId) {
        next.legalBundleId = defaults.legalBundleId;
        changed = true;
      }
      if (!prev.consentTemplateId && defaults.consentTemplateId) {
        next.consentTemplateId = defaults.consentTemplateId;
        changed = true;
      }

      if (
        Array.isArray(prev.payment) &&
        prev.payment.length === 0 &&
        paymentTemplate?.provider
      ) {
        next.payment = [paymentTemplate.provider];
        changed = true;
      }
      if (!prev.billingProvider && paymentTemplate?.provider) {
        next.billingProvider = paymentTemplate.provider;
        changed = true;
      }
      if (
        Array.isArray(prev.shipping) &&
        prev.shipping.length === 0 &&
        shippingTemplate?.provider
      ) {
        next.shipping = [shippingTemplate.provider];
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [data, setState]);

  return <>{children}</>;
}

export function RapidLaunchProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <ConfiguratorProvider>
      <RapidLaunchDefaultsProvider>
        <RapidLaunchDefaultsApplier>{children}</RapidLaunchDefaultsApplier>
      </RapidLaunchDefaultsProvider>
    </ConfiguratorProvider>
  );
}
