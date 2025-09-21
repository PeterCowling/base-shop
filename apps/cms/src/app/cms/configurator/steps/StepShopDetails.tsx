"use client";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/atoms/shadcn";
import { useContext, useMemo } from "react";
import { z } from "zod";
import type { ConfiguratorStepProps } from "@/types/configurator";
import useConfiguratorStep from "./hooks/useConfiguratorStep";
import ShopPreview from "./components/ShopPreview";
import ImagePicker from "@ui/components/cms/page-builder/ImagePicker";
import { ConfiguratorContext } from "../ConfiguratorContext";
import type { ConfiguratorState } from "../../wizard/schema";

export default function StepShopDetails(
  props: ConfiguratorStepProps,
): React.JSX.Element {
  const configurator = useContext(ConfiguratorContext);

  const fallbackState: Pick<ConfiguratorState, "shopId" | "storeName" | "logo" | "contactInfo" | "type" | "template"> = {
    shopId: "",
    storeName: "",
    logo: {},
    contactInfo: "",
    type: "sale",
    template: "",
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
    type = state.type ?? "sale",
    setType = (value: "sale" | "rental") => updateField("type", value),
    template = state.template ?? "",
    setTemplate = (value: string) => updateField("template", value),
    templates = [],
    errors = {},
  } = props as Partial<ConfiguratorStepProps>;

  const logoRecord =
    typeof logoProp === "string" && logoProp
      ? { "desktop-landscape": logoProp }
      : { ...(logoProp ?? {}) };

  const templateOptions = templates.length
    ? templates
    : template
      ? [template]
      : ["default"];

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
          contactInfo: z.string().min(1, "Required"),
          type: z.enum(["sale", "rental"]),
          template: z.string().min(1, "Required"),
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
        type,
        template,
      },
    });

  const getError = (field: string) => internalError(field) || errors[field]?.[0];
  const isValid = hookValid && Object.keys(errors).length === 0;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Shop Details</h2>
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
          <div className="flex items-center gap-2">
            <Input
              data-cy={`logo-${key}`}
              value={logoRecord[key] ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLogo({ ...logoRecord, [key]: e.target.value })
              }
              placeholder="https://example.com/logo.png"
            />
            <ImagePicker
              onSelect={(url) => setLogo({ ...logoRecord, [key]: url })}
            >
              <Button type="button">Select</Button>
            </ImagePicker>
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactInfo(e.target.value)}
          placeholder="Email or phone"
        />
        {getError("contactInfo") && (
          <p className="text-sm text-danger-foreground">{getError("contactInfo")}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Shop Type</span>
        <Select data-cy="shop-type" value={type} onValueChange={setType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sale">Sale</SelectItem>
            <SelectItem value="rental">Rental</SelectItem>
          </SelectContent>
        </Select>
        {getError("type") && (
          <p className="text-sm text-danger-foreground">{getError("type")}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Template</span>
        <Select data-cy="template" value={template} onValueChange={setTemplate}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            {templateOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {getError("template") && (
          <p className="text-sm text-danger-foreground">{getError("template")}</p>
        )}
      </label>
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
