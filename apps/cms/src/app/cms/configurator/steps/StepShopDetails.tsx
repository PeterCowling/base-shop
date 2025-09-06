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
import { useMemo } from "react";
import { z } from "zod";
import type { ConfiguratorStepProps } from "@/types/configurator";
import useConfiguratorStep from "./hooks/useConfiguratorStep";
import ShopPreview from "./components/ShopPreview";

export default function StepShopDetails({
  shopId,
  setShopId,
  storeName,
  setStoreName,
  logo,
  setLogo,
  contactInfo,
  setContactInfo,
  type,
  setType,
  template,
  setTemplate,
  templates,
  errors = {},
}: ConfiguratorStepProps): React.JSX.Element {
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
          logo: z.string().url("Invalid URL"),
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
        logo,
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
      <ShopPreview logo={logo} storeName={storeName} />
      <label className="flex flex-col gap-1">
        <span>Shop ID</span>
        <Input
          data-cy="shop-id"
          value={shopId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShopId(e.target.value)}
          placeholder="my-shop"
        />
        {getError("id") && (
          <p className="text-sm text-red-600">{getError("id")}</p>
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
          <p className="text-sm text-red-600">{getError("name")}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Logo URL</span>
        <Input
          data-cy="logo-url"
          value={logo}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogo(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
        {getError("logo") && (
          <p className="text-sm text-red-600">{getError("logo")}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Contact Info</span>
        <Input
          data-cy="contact-info"
          value={contactInfo}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactInfo(e.target.value)}
          placeholder="Email or phone"
        />
        {getError("contactInfo") && (
          <p className="text-sm text-red-600">{getError("contactInfo")}</p>
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
          <p className="text-sm text-red-600">{getError("type")}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Template</span>
        <Select data-cy="template" value={template} onValueChange={setTemplate}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {getError("template") && (
          <p className="text-sm text-red-600">{getError("template")}</p>
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
