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
  onNext: () => void;
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
  onNext,
  errors = {},
}: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("shop-details");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Shop Details</h2>
      <label className="flex flex-col gap-1">
        <span>Shop ID</span>
        <Input
          value={shopId}
          onChange={(e) => setShopId(e.target.value)}
          placeholder="my-shop"
        />
        {errors.id && (
          <p className="text-sm text-red-600">{errors.id[0]}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Store Name</span>
        <Input
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="My Store"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name[0]}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Logo URL</span>
        <Input
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
        {errors.logo && (
          <p className="text-sm text-red-600">{errors.logo[0]}</p>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Contact Info</span>
        <Input
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          placeholder="Email or phone"
        />
        {errors.contactInfo && (
          <p className="text-sm text-red-600">{errors.contactInfo[0]}</p>
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
        {errors.type && (
          <p className="text-sm text-red-600">{errors.type[0]}</p>
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
      </label>
      <div className="flex justify-end gap-2">
        <Button
          disabled={!shopId}
          onClick={() => {
            markComplete(true);
            onNext();
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
