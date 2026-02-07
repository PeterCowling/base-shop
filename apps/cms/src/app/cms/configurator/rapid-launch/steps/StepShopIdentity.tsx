"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Inline } from "@acme/design-system/primitives";
import { Button, Input } from "@acme/design-system/shadcn";
import { LOCALES,useTranslations } from "@acme/i18n";
import { slugify } from "@acme/lib/string";
import { validateShopName } from "@acme/platform-core/shops/client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";

import type { ConfiguratorState } from "../../../wizard/schema";
import { useConfigurator } from "../../ConfiguratorContext";
import useStepCompletion from "../../hooks/useStepCompletion";
import type { RapidLaunchStepProps } from "../types";

const CURRENCY_OPTIONS = ["EUR", "USD", "GBP"] as const;

function currencyForLocale(locale: string): string {
  switch (locale) {
    case "de":
    case "it":
      return "EUR";
    case "en":
    default:
      return "EUR";
  }
}

export default function StepShopIdentity({
  prevStepId,
  nextStepId,
}: RapidLaunchStepProps): React.JSX.Element {
  const t = useTranslations();
  const { state, update } = useConfigurator();
  const router = useRouter();
  const [, markComplete] = useStepCompletion("shop-identity");

  const [slugTouched, setSlugTouched] = useState(false);
  const [currencyTouched, setCurrencyTouched] = useState(false);

  const storeName = state.storeName ?? "";
  const shopId = state.shopId ?? "";
  const locale = state.locale ?? "en";
  const currency = state.currency ?? "EUR";

  useEffect(() => {
    if (!slugTouched && storeName) {
      const nextSlug = slugify(storeName);
      if (nextSlug && nextSlug !== shopId) {
        update("shopId", nextSlug);
      }
    }
  }, [storeName, slugTouched, shopId, update]);

  useEffect(() => {
    if (!currencyTouched) {
      const nextCurrency = currencyForLocale(locale);
      if (nextCurrency !== currency) {
        update("currency", nextCurrency);
      }
    }
  }, [locale, currency, currencyTouched, update]);

  const slugError = useMemo(() => {
    if (!shopId) return String(t("cms.rapidLaunch.identity.shopId.required"));
    try {
      validateShopName(shopId);
      return null;
    } catch (err) {
      return (err as Error).message;
    }
  }, [shopId, t]);

  const nameError = !storeName
    ? String(t("cms.rapidLaunch.identity.shopName.required"))
    : null;

  const isValid = !nameError && !slugError && Boolean(locale) && Boolean(currency);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {t("cms.rapidLaunch.identity.heading")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("cms.rapidLaunch.identity.subheading")}
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span>{t("cms.rapidLaunch.identity.shopName.label")}</span>
        <Input
          value={storeName}
          placeholder={String(t("cms.rapidLaunch.identity.shopName.placeholder"))}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            update("storeName", e.target.value)
          }
        />
        {nameError && (
          <p className="text-sm text-danger-foreground">{nameError}</p>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span>{t("cms.rapidLaunch.identity.shopId.label")}</span>
        <Input
          value={shopId}
          placeholder={String(t("cms.rapidLaunch.identity.shopId.placeholder"))}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSlugTouched(true);
            update("shopId", e.target.value);
          }}
        />
        <p className="text-xs text-muted-foreground">
          {t("cms.rapidLaunch.identity.shopId.help", { id: shopId || "your-shop" })}
        </p>
        {slugError && (
          <p className="text-sm text-danger-foreground">{slugError}</p>
        )}
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span>{t("cms.rapidLaunch.identity.locale.label")}</span>
          <Select
            value={locale}
            onValueChange={(value) =>
              update("locale", value as ConfiguratorState["locale"])
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={String(t("cms.rapidLaunch.identity.locale.placeholder"))}
              />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-1">
          <span>{t("cms.rapidLaunch.identity.currency.label")}</span>
          <Select
            value={currency}
            onValueChange={(value) => {
              setCurrencyTouched(true);
              update("currency", value);
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={String(t("cms.rapidLaunch.identity.currency.placeholder"))}
              />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((cur) => (
                <SelectItem key={cur} value={cur}>
                  {cur}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

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
            disabled={!isValid}
          >
            {t("wizard.next")}
          </Button>
        )}
      </Inline>
    </div>
  );
}
