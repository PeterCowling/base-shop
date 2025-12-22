"use client";

import { Button, Input } from "@ui/components/atoms/shadcn";
import { useContext, useMemo } from "react";
import { z } from "zod";
import type { ConfiguratorStepProps } from "@/types/configurator";
import useConfiguratorStep from "./hooks/useConfiguratorStep";
import ShopPreview from "./components/ShopPreview";
import { ImagePicker } from "@acme/page-builder-ui";
import { ConfiguratorContext } from "../ConfiguratorContext";
import type { ConfiguratorState } from "../../wizard/schema";
import Image from "next/image";
import { useTranslations } from "@acme/i18n";

export default function StepShopDetails(
  props: ConfiguratorStepProps,
): React.JSX.Element {
  const t = useTranslations();
  const configurator = useContext(ConfiguratorContext);

  const fallbackState: Pick<ConfiguratorState, "shopId" | "storeName" | "logo" | "contactInfo"> = {
    shopId: "",
    storeName: "",
    logo: {},
    contactInfo: "",
  };

  const state = configurator?.state ?? fallbackState;
  type Updater = <K extends keyof ConfiguratorState>(
    key: K,
    value: ConfiguratorState[K],
  ) => void;
  const noopUpdater: Updater = () => undefined;
  const updateField: Updater = configurator?.update ?? noopUpdater;
  const {
    shopId = state.shopId ?? "",
    setShopId = (value: string) => updateField("shopId", value),
    storeName = state.storeName ?? "",
    setStoreName = (value: string) => updateField("storeName", value),
    logo: logoProp = state.logo,
    setLogo = (value: Record<string, string>) => updateField("logo", value),
    contactInfo = state.contactInfo ?? "",
    setContactInfo = (value: string) => updateField("contactInfo", value),
    errors = {},
  } = props as Partial<ConfiguratorStepProps>;

  const logoRecord =
    typeof logoProp === "string" && logoProp
      ? { "desktop-landscape": logoProp }
      : { ...(logoProp ?? {}) };

  const schema = useMemo(
    () =>
      z
        .object({
          id: z
            .string()
            .min(1, "Required")
            .regex(/^[a-z0-9-]+$/, {
              message: "Lowercase letters, numbers, and dashes only",
            }),
          name: z.string().min(1, "Required"),
          logo: z
            .record(z.string(), z.string().url("Invalid URL"))
            .optional()
            .default({}),
          contactInfo: z.string().email("Invalid email"),
        })
        .strict(),
    [],
  );

  const { router, markComplete, getError: internalError, isValid: hookValid } =
    useConfiguratorStep({
      stepId: "shop-details",
      schema,
      values: {
        id: shopId,
        name: storeName,
        logo: logoRecord,
        contactInfo,
      },
    });

  const getError = (field: string) => internalError(field) || errors[field]?.[0];
  const isValid = hookValid && Object.keys(errors).length === 0;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold" data-tour="quest-basics">
          {t("cms.configurator.shopDetails.title")}
        </h2>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-foreground">
          {t("cms.configurator.time.badge.start")}
        </div>
      </div>
      <ShopPreview logos={logoRecord} shopName={storeName} />
      <label className="flex flex-col gap-1">
        <span>Shop ID</span>
        <Input
          data-cy="shop-id"
          value={shopId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShopId(e.target.value)}
          placeholder="my-shop"
        />
        {getError("id") && (
          <p className="text-sm text-danger-foreground">{getError("id")}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Store Name</span>
        <Input
          data-cy="store-name"
          value={storeName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoreName(e.target.value)}
          placeholder="My Store"
        />
        {getError("name") && (
          <p className="text-sm text-danger-foreground">{getError("name")}</p>
        )}
      </label>
      {([
        "desktop-landscape",
        "desktop-portrait",
        "tablet-landscape",
        "tablet-portrait",
        "mobile-landscape",
        "mobile-portrait",
      ] as const).map((key) => (
        <label key={key} className="flex flex-col gap-1">
          <span className="capitalize">{key.replace("-", " ")} logo</span>
          <div className="flex items-center gap-3">
            <ImagePicker onSelect={(url: string) => setLogo({ ...logoRecord, [key]: url })}>
              <Button type="button">Select</Button>
            </ImagePicker>
            {logoRecord[key] ? (
              <Image
                src={logoRecord[key]!}
                alt={`${key} logo preview`}
                width={80}
                height={40}
                className="h-10 w-auto rounded border border-border-3 object-contain bg-white"
              />
            ) : (
              <span className="text-xs text-muted-foreground">No logo selected</span>
            )}
          </div>
          {getError(`logo.${key}`) && (
            <p className="text-sm text-danger-foreground">{getError(`logo.${key}`)}</p>
          )}
        </label>
      ))}
      <label className="flex flex-col gap-1">
        <span>Contact Info</span>
        <Input
          data-cy="contact-info"
          value={contactInfo}
          type="email"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactInfo(e.target.value)}
          placeholder="you@company.com"
        />
        {getError("contactInfo") && (
          <p className="text-sm text-danger-foreground">{getError("contactInfo")}</p>
        )}
      </label>
      {/* Shop type selection moved to dedicated step */}
      <div className="flex justify-end">
        <Button
          data-cy="save-return"
          disabled={!isValid}
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
