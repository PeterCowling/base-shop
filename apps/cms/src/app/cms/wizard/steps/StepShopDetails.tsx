"use client";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms-shadcn";

interface Props {
  shopId: string;
  setShopId: (v: string) => void;
  storeName: string;
  setStoreName: (v: string) => void;
  logo: string;
  setLogo: (v: string) => void;
  contactInfo: string;
  setContactInfo: (v: string) => void;
  template: string;
  setTemplate: (v: string) => void;
  templates: string[];
  onNext: () => void;
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
  template,
  setTemplate,
  templates,
  onNext,
}: Props): React.JSX.Element {
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
      </label>
      <label className="flex flex-col gap-1">
        <span>Store Name</span>
        <Input
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="My Store"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Logo URL</span>
        <Input
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Contact Info</span>
        <Input
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          placeholder="Email or phone"
        />
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
        <Button disabled={!shopId} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
