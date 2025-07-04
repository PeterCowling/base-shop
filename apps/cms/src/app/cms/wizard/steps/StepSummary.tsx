"use client";

import { Button, Input } from "@/components/atoms-shadcn";
import { Locale, LOCALES } from "@types";
import WizardPreview from "../WizardPreview";

interface Props {
  shopId: string;
  name: string;
  logo: string;
  contactInfo: string;
  template: string;
  theme: string;
  payment: string[];
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
  onBack: () => void;
  creating: boolean;
  submit: () => void;
}

export default function StepSummary({
  shopId,
  name,
  logo,
  contactInfo,
  template,
  theme,
  payment,
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
  onBack,
  creating,
  submit,
}: Props): React.JSX.Element {
  const languages = LOCALES as readonly Locale[];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Summary</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <b>Shop ID:</b> {shopId}
        </li>
        <li>
          <b>Store Name:</b> {name}
        </li>
        <li>
          <b>Logo:</b> {logo || "none"}
        </li>
        <li>
          <b>Contact:</b> {contactInfo || "none"}
        </li>
        <li>
          <b>Template:</b> {template}
        </li>
        <li>
          <b>Theme:</b> {theme}
        </li>
        <li>
          <b>Payment:</b> {payment.join(", ") || "none"}
        </li>
        <li>
          <b>Shipping:</b> {shipping.join(", ") || "none"}
        </li>
        <li>
          <b>Analytics:</b> {analyticsProvider || "none"}
        </li>
      </ul>
      {languages.map((l) => (
        <div key={l} className="space-y-2">
          <label className="flex flex-col gap-1">
            <span>Home page title ({l})</span>
            <Input
              value={pageTitle[l]}
              onChange={(e) =>
                setPageTitle({ ...pageTitle, [l]: e.target.value })
              }
              placeholder="Home"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Description ({l})</span>
            <Input
              value={pageDescription[l]}
              onChange={(e) =>
                setPageDescription({ ...pageDescription, [l]: e.target.value })
              }
              placeholder="Page description"
            />
          </label>
        </div>
      ))}
      <label className="flex flex-col gap-1">
        <span>Social image URL</span>
        <Input
          value={socialImage}
          onChange={(e) => setSocialImage(e.target.value)}
          placeholder="https://example.com/og.png"
        />
      </label>
      {result && <p className="text-sm">{result}</p>}
      <WizardPreview style={themeStyle} />
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button disabled={creating} onClick={submit}>
          {creating ? "Creating…" : "Create Shop"}
        </Button>
      </div>
    </div>
  );
}
