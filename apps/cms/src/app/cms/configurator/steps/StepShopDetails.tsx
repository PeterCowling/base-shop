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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import useStepCompletion from "../hooks/useStepCompletion";

interface Props {
  shopId: string;
  setShopId: (v: string) => void;
  storeName: string;
  setStoreName: (v: string) => void;
  logo: string;
  setLogo: (v: string) => void;
  contactInfo: string;
  setContactInfo: (v: string) => void;
  type: "sale" | "rental";
  setType: (v: "sale" | "rental") => void;
  template: string;
  setTemplate: (v: string) => void;
  templates: string[];
  errors?: Record<string, string[]>;
}

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
}: Props): React.JSX.Element {
  const router = useRouter();
  const [, markComplete] = useStepCompletion("shop-details");
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const schema = z
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
    .strict();

  useEffect(() => {
    const parsed = schema.safeParse({
      id: shopId,
      name: storeName,
      logo,
      contactInfo,
      type,
      template,
    });
    if (!parsed.success) {
      setValidationErrors(parsed.error.flatten().fieldErrors);
    } else {
      setValidationErrors({});
    }
  }, [shopId, storeName, logo, contactInfo, type, template]);

  const getError = (field: string) =>
    validationErrors[field]?.[0] || errors[field]?.[0];

  const isValid = Object.keys(validationErrors).length === 0;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Shop Details</h2>
      <div className="flex items-center gap-2 rounded border p-2">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt="Logo preview"
            className="h-8 w-8 object-contain"
          />
        ) : (
          <div className="h-8 w-8 bg-gray-200" />
        )}
        <span>{storeName || "Store Name"}</span>
      </div>
      <label className="flex flex-col gap-1">
        <span>Shop ID</span>
        <Input
          value={shopId}
          onChange={(e) => setShopId(e.target.value)}
          placeholder="my-shop"
        />
        {getError("id") && (
          <p className="text-sm text-red-600">{getError("id")}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Store Name</span>
        <Input
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="My Store"
        />
        {getError("name") && (
          <p className="text-sm text-red-600">{getError("name")}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Logo URL</span>
        <Input
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
        {getError("logo") && (
          <p className="text-sm text-red-600">{getError("logo")}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Contact Info</span>
        <Input
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          placeholder="Email or phone"
        />
        {getError("contactInfo") && (
          <p className="text-sm text-red-600">{getError("contactInfo")}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Shop Type</span>
        <Select value={type} onValueChange={setType}>
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
        <Select value={template} onValueChange={setTemplate}>
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
