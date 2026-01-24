"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

import { Alert, Tag } from "@acme/design-system/atoms";
import { Grid, Inline, Stack } from "@acme/design-system/primitives";
import { Button, Input } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";

import { useConfigurator } from "../../ConfiguratorContext";
import useStepCompletion from "../../hooks/useStepCompletion";
import { useRapidLaunchProducts } from "../hooks/useRapidLaunchProducts";
import { useRapidLaunchDefaultsContext } from "../RapidLaunchDefaultsContext";
import type { RapidLaunchStepProps } from "../types";

export default function StepComplianceSeo({
  prevStepId,
  nextStepId,
}: RapidLaunchStepProps): React.JSX.Element {
  const t = useTranslations();
  const router = useRouter();
  const { state, update } = useConfigurator();
  const { data, loading, error } = useRapidLaunchDefaultsContext();
  const [, markComplete] = useStepCompletion("compliance");

  const locale = state.locale ?? "en";
  const { products } = useRapidLaunchProducts({
    shopId: state.shopId ?? "",
    locale,
  });

  const selectedProducts = useMemo(() => {
    const selected = new Set(state.rapidLaunchProductIds ?? []);
    return products.filter((p) => selected.has(p.id));
  }, [products, state.rapidLaunchProductIds]);

  const productNames = selectedProducts
    .map((p) => p.title)
    .filter((name) => Boolean(name))
    .slice(0, 3);

  const autoTitle = useMemo(() => {
    const name = state.storeName || t("cms.rapidLaunch.seo.defaultShopName");
    return `${name} | Online Shop`;
  }, [state.storeName, t]);

  const autoDescription = useMemo(() => {
    const name = state.storeName || t("cms.rapidLaunch.seo.defaultShopName");
    if (productNames.length > 0) {
      return t("cms.rapidLaunch.seo.descriptionWithProducts", {
        name,
        products: productNames.join(", "),
      }) as string;
    }
    return t("cms.rapidLaunch.seo.descriptionNoProducts", { name }) as string;
  }, [productNames, state.storeName, t]);

  const autoRef = useRef<{ title: string; description: string }>({
    title: "",
    description: "",
  });

  useEffect(() => {
    const pageTitle = state.pageTitle ?? {};
    const pageDescription = state.pageDescription ?? {};
    const currentTitle = pageTitle[locale] ?? "";
    const currentDescription = pageDescription[locale] ?? "";
    const shouldUpdateTitle =
      !currentTitle ||
      currentTitle === "Home" ||
      currentTitle === autoRef.current.title;
    const shouldUpdateDescription =
      !currentDescription || currentDescription === autoRef.current.description;

    if (shouldUpdateTitle && autoTitle !== currentTitle) {
      update("pageTitle", { ...pageTitle, [locale]: autoTitle });
      autoRef.current.title = autoTitle;
    }
    if (shouldUpdateDescription && autoDescription !== currentDescription) {
      update("pageDescription", {
        ...pageDescription,
        [locale]: autoDescription,
      });
      autoRef.current.description = autoDescription;
    }
  }, [autoTitle, autoDescription, locale, state.pageTitle, state.pageDescription, update]);

  const legalBundles = data?.options.legalBundles ?? [];
  const selectedLegalBundle = legalBundles.find(
    (bundle) => bundle.id === state.legalBundleId
  );

  const consentOptions = useMemo(() => {
    const consentTemplates = data?.options.consentTemplates ?? [];
    const seen = new Set<string>();
    return consentTemplates.filter((template) => {
      if (seen.has(template.id)) return false;
      seen.add(template.id);
      return true;
    });
  }, [data?.options.consentTemplates]);

  const canContinue =
    Boolean(state.legalBundleId) &&
    Boolean(state.consentTemplateId) &&
    Boolean(state.pageTitle?.[locale]) &&
    Boolean(state.pageDescription?.[locale]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {t("cms.rapidLaunch.compliance.heading")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("cms.rapidLaunch.compliance.subheading")}
        </p>
      </div>

      {error && <Alert variant="warning" tone="soft" heading={error} />}

      <section className="space-y-3">
        <Inline alignY="center" gap={3} className="justify-between">
          <h3 className="text-sm font-semibold">
            {t("cms.rapidLaunch.compliance.legal.heading")}
          </h3>
          {loading && (
            <span className="text-xs text-muted-foreground">
              {t("cms.rapidLaunch.compliance.loading")}
            </span>
          )}
        </Inline>
        <Grid cols={1} gap={3} className="md:grid-cols-2">
          {legalBundles.map((bundle) => {
            const selected = bundle.id === state.legalBundleId;
            return (
              <button
                key={bundle.id}
                type="button"
                className={`rounded-2xl border p-4 text-left transition ${
                  selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
                }`}
                onClick={() => {
                  update("legalBundleId", bundle.id);
                  if (
                    (!state.consentTemplateId ||
                      state.consentTemplateId === selectedLegalBundle?.consentId) &&
                    bundle.consentId
                  ) {
                    update("consentTemplateId", bundle.consentId);
                  }
                }}
              >
                <Stack gap={3}>
                  <Inline alignY="start" gap={2} className="justify-between">
                  <div className="text-sm font-semibold">{bundle.name}</div>
                  {bundle.approved ? (
                    <Tag variant="success">{t("cms.rapidLaunch.compliance.approved")}</Tag>
                  ) : (
                    <Tag variant="warning">{t("cms.rapidLaunch.compliance.needsApproval")}</Tag>
                  )}
                  </Inline>
                  {selected && bundle.consentId && (
                  <p className="text-xs text-muted-foreground">
                    {t("cms.rapidLaunch.compliance.consentAutoSet")}
                  </p>
                )}
                </Stack>
              </button>
            );
          })}
        </Grid>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">
          {t("cms.rapidLaunch.compliance.consent.heading")}
        </h3>
        <Select
          value={state.consentTemplateId}
          onValueChange={(value) => update("consentTemplateId", value)}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={String(t("cms.rapidLaunch.compliance.consent.placeholder"))}
            />
          </SelectTrigger>
          <SelectContent>
            {consentOptions.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">
          {t("cms.rapidLaunch.seo.heading")}
        </h3>
        <Stack asChild gap={1}>
          <label>
            <span>{t("cms.rapidLaunch.seo.title.label")}</span>
            <Input
              value={state.pageTitle?.[locale] ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update("pageTitle", {
                  ...(state.pageTitle ?? {}),
                  [locale]: e.target.value,
                })
              }
            />
          </label>
        </Stack>
        <Stack asChild gap={1}>
          <label>
            <span>{t("cms.rapidLaunch.seo.description.label")}</span>
            <Input
              value={state.pageDescription?.[locale] ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update("pageDescription", {
                  ...(state.pageDescription ?? {}),
                  [locale]: e.target.value,
                })
              }
            />
          </label>
        </Stack>
      </section>

      <Inline gap={3} className="justify-between">
        {prevStepId ? (
          <Button variant="outline" onClick={() => router.push(`/cms/configurator/rapid-launch/${prevStepId}`)}>
            {t("wizard.back")}
          </Button>
        ) : (
          <span />
        )}
        {nextStepId ? (
          <Button
            onClick={() => {
              markComplete(true);
              router.push(`/cms/configurator/rapid-launch/${nextStepId}`);
            }}
            disabled={!canContinue}
          >
            {t("wizard.next")}
          </Button>
        ) : (
          <Button
            onClick={() => {
              markComplete(true);
              router.push("/cms/configurator/rapid-launch/review");
            }}
            disabled={!canContinue}
          >
            {t("cms.rapidLaunch.compliance.reviewButton")}
          </Button>
        )}
      </Inline>
    </div>
  );
}
