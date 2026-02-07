// apps/cms/src/app/cms/configurator/steps/StepSummary.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CmsLaunchChecklist,
  type CmsLaunchChecklistItem,
  type CmsLaunchStatus,
} from "@acme/cms-ui"; // UI: @acme/ui/components/cms/CmsLaunchChecklist
import { Button, Input } from "@acme/design-system/shadcn";
import { LOCALES, useTranslations } from "@acme/i18n";
import type { ConfiguratorProgress,Locale  } from "@acme/types";
import { type DevicePreset,devicePresets } from "@acme/ui/utils/devicePresets";

import PreviewDeviceSelector from "../../wizard/PreviewDeviceSelector";
import WizardPreview from "../../wizard/WizardPreview";
import { buildLaunchChecklist } from "../hooks/dashboard/launchChecklist";
import useStepCompletion from "../hooks/useStepCompletion";

interface Props {
  shopId: string;
  name: string;
  logo: Record<string, string>;
  contactInfo: string;
  type: "sale" | "rental";
  theme: string;
  payment: string[];
  billingProvider?: string;
  shipping: string[];
  analyticsProvider: string;
  pageTitle: Record<Locale, string>;
  setPageTitle: (v: Record<Locale, string>) => void;
  pageDescription: Record<Locale, string>;
  setPageDescription: (v: Record<Locale, string>) => void;
  socialImage: string;
  setSocialImage: (v: string) => void;
  result: string | null;
  themeStyle: React.CSSProperties;
  creating: boolean;
  submit: () => Promise<void> | void;
  errors?: Record<string, string[]>;
}

export default function StepSummary({
  shopId,
  name,
  logo,
  contactInfo,
  type,
  theme,
  payment,
  billingProvider,
  shipping,
  analyticsProvider,
  pageTitle,
  setPageTitle,
  pageDescription,
  setPageDescription,
  socialImage,
  setSocialImage,
  result,
  themeStyle,
  creating,
  submit,
  errors = {},
}: Props): React.JSX.Element {
  const languages = LOCALES as readonly Locale[];
  const [, markComplete] = useStepCompletion("summary");
  const router = useRouter();
  const [device, setDevice] = useState<DevicePreset>(devicePresets[0]);
  const t = useTranslations();
  const [launchItems, setLaunchItems] = useState<CmsLaunchChecklistItem[]>([]);

  useEffect(() => {
    if (!shopId) return;
    if (typeof window === "undefined" || typeof fetch === "undefined") return;

    let cancelled = false;
    const tFunc = t as unknown as (key: string) => string;

    fetch(`/api/configurator-progress?shopId=${encodeURIComponent(shopId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: ConfiguratorProgress | null) => {
        if (!json || cancelled) return;
        if (!json.steps) return;
        const checklist = buildLaunchChecklist({
          progress: json,
          translate: tFunc,
        });
        const mapped: CmsLaunchChecklistItem[] = checklist.map((item) => ({
          id: item.id,
          label: item.label,
          status: item.status as CmsLaunchStatus,
          statusLabel: item.statusLabel,
          fixLabel: item.fixLabel,
          href: item.targetHref,
        }));
        setLaunchItems(mapped);
      })
      .catch(() => {
        // Ignore network errors; summary can still render without the checklist.
      });

    return () => {
      cancelled = true;
    };
  }, [shopId, t]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        {t("cms.configurator.summary.heading")}
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("cms.configurator.summary.shopSnapshot")}
          </h3>
          <ul className="list-disc pl-5 text-sm">
            <li>
              <span className="font-semibold">
                {t("cms.configurator.summary.shopIdLabel")}
              </span>{" "}
              {shopId}
            </li>
            <li>
              <span className="font-semibold">
                {t("cms.configurator.summary.storeNameLabel")}
              </span>{" "}
              {name}
            </li>
            <li>
              <span className="font-semibold">
                {t("cms.configurator.summary.logoLabel")}
              </span>{" "}
              {logo["desktop-landscape"] || Object.values(logo)[0] || t("cms.configurator.summary.none")}
            </li>
            <li>
              <span className="font-semibold">
                {t("cms.configurator.summary.contactLabel")}
              </span>{" "}
              {contactInfo || t("cms.configurator.summary.none")}
            </li>
            <li>
              <span className="font-semibold">
                {t("cms.configurator.summary.typeLabel")}
              </span>{" "}
              {type}
            </li>
            <li>
              <span className="font-semibold">
                {t("cms.configurator.summary.themeLabel")}
              </span>{" "}
              {theme}
            </li>
            <li>
              <span className="font-semibold">
                {t("cms.configurator.summary.paymentLabel")}
              </span>{" "}
              {payment.length ? payment.join(", ") : t("cms.configurator.summary.none")}
            </li>
            <li>
              <span className="font-semibold">
                Billing {/* i18n-exempt -- CMS summary label; admin-only dashboard copy */}
              </span>{" "}
              {billingProvider || t("cms.configurator.summary.none")}
            </li>
            <li>
              <span className="font-semibold">
                {t("cms.configurator.summary.shippingLabel")}
              </span>{" "}
              {shipping.length ? shipping.join(", ") : t("cms.configurator.summary.none")}
            </li>
            <li>
              <span className="font-semibold">
                {t("cms.configurator.summary.analyticsLabel")}
              </span>{" "}
              {analyticsProvider || t("cms.configurator.summary.none")}
            </li>
          </ul>
        </div>
        {launchItems.length > 0 ? (
          <div className="space-y-3">
            <CmsLaunchChecklist
              heading={String(t("cms.configurator.launchChecklist.heading"))}
              readyLabel={String(t("cms.configurator.launchChecklist.readyLabel"))}
              showReadyCelebration
              items={launchItems}
            />
          </div>
        ) : null}
      </div>

      {languages.map((l) => (
        <div key={l} className="space-y-2">
          <label className="flex flex-col gap-1">
            <span>Home page title ({l})</span>
            <Input
              data-cy={`page-title-${l}`}
              value={pageTitle[l]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPageTitle({ ...pageTitle, [l]: e.target.value })
              }
              placeholder="Home"
            />
            {errors[`pageTitle.${l}`] && (
              <p className="text-sm text-danger-foreground">
                {errors[`pageTitle.${l}`][0]}
              </p>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span>Description ({l})</span>
            <Input
              data-cy={`page-description-${l}`}
              value={pageDescription[l]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPageDescription({
                  ...pageDescription,
                  [l]: e.target.value,
                })
              }
              placeholder="Page description"
            />
            {errors[`pageDescription.${l}`] && (
              <p className="text-sm text-danger-foreground">
                {errors[`pageDescription.${l}`][0]}
              </p>
            )}
          </label>
        </div>
      ))}

      <label className="flex flex-col gap-1">
        <span>Social image URL</span>
        <Input
          data-cy="social-image-url"
          value={socialImage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSocialImage(e.target.value)
          }
          placeholder="https://example.com/og.png"
        />
        {errors.socialImage && (
          <p className="text-sm text-danger-foreground">{errors.socialImage[0]}</p>
        )}
      </label>

      {result && (
        <div className="mt-2">
          <span className="rounded bg-success-soft px-2 py-1 text-sm text-foreground">{result}</span>
        </div>
      )}

      <PreviewDeviceSelector onChange={setDevice} />
      <WizardPreview style={themeStyle} device={device} />

      <div className="flex justify-end">
        <Button
          data-cy="save-return"
          disabled={creating}
          onClick={async () => {
            await submit();
            markComplete(true);
            router.push("/cms/configurator");
          }}
          className="ms-auto"
        >
          {creating ? "Saving…" : "Save & return"}
        </Button>
      </div>
    </div>
  );
}
