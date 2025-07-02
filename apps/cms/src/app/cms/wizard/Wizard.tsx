"use client";

import { Progress } from "@/components/atoms";
import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms-shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { Footer, Header, SideNav } from "@/components/organisms";
import { AppShell } from "@/components/templates/AppShell";
import TranslationsProvider from "@/i18n/Translations";
import enMessages from "@i18n/en.json";
import { tokens as baseTokensSrc } from "@themes/base/tokens";
import type { Page, PageComponent } from "@types";
import { useEffect, useState } from "react";

function WizardPreview({
  style,
}: {
  style: React.CSSProperties;
}): React.JSX.Element {
  return (
    <div style={style} className="rounded border">
      <TranslationsProvider messages={enMessages}>
        <AppShell
          header={<Header locale="en" />}
          sideNav={<SideNav />}
          footer={<Footer />}
        >
          <HeroBanner />
          <ValueProps />
          <ReviewsCarousel />
        </AppShell>
      </TranslationsProvider>
    </div>
  );
}

interface Props {
  themes: string[];
  templates: string[];
  disabled?: boolean;
}

type TokenMap = Record<`--${string}`, string>;

const baseTokens: TokenMap = Object.fromEntries(
  Object.entries(baseTokensSrc).map(([k, v]) => [k, v.light])
) as TokenMap;

async function loadThemeTokens(theme: string): Promise<TokenMap> {
  if (theme === "base") return baseTokens;
  try {
    const mod = await import(`@themes/${theme}/tokens`);
    return Object.fromEntries(
      Object.entries(mod.tokens as Record<string, { light: string }>).map(
        ([k, v]) => [k, v.light]
      )
    ) as TokenMap;
  } catch {
    try {
      const mod = await import(`@themes/${theme}/tailwind-tokens`);
      return mod.tokens as TokenMap;
    } catch {
      return baseTokens;
    }
  }
}

export default function Wizard({ themes, templates, disabled }: Props) {
  const [step, setStep] = useState(0);
  const [shopId, setShopId] = useState("");
  const [template, setTemplate] = useState(templates[0] ?? "");
  const [theme, setTheme] = useState(themes[0] ?? "");
  const [payment, setPayment] = useState<string[]>([]);
  const [shipping, setShipping] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [themeVars, setThemeVars] = useState<TokenMap>(baseTokens);
  const [domain, setDomain] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("Home");
  const [pageDescription, setPageDescription] = useState("");
  const [socialImage, setSocialImage] = useState("");
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [analyticsProvider, setAnalyticsProvider] = useState("");
  const [analyticsId, setAnalyticsId] = useState("");
  const [pages, setPages] = useState<
    {
      slug: string;
      title: string;
      description: string;
      image: string;
      components: PageComponent[];
    }[]
  >([]);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newComponents, setNewComponents] = useState<PageComponent[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadThemeTokens(theme).then(setThemeVars);
  }, [theme]);

  function hslToHex(hsl: string): string {
    const [h, s, l] = hsl
      .split(" ")
      .map((p, i) => (i === 0 ? parseFloat(p) : parseFloat(p) / 100));
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function hexToHsl(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h *= 60;
    }
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

  const sansFonts = [
    '"Geist Sans", system-ui, sans-serif',
    "Arial, sans-serif",
    "ui-sans-serif, system-ui",
  ];
  const monoFonts = [
    '"Geist Mono", ui-monospace, monospace',
    '"Courier New", monospace',
  ];

  function toggle(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  async function submit() {
    setCreating(true);
    setResult(null);
    let json: any = null;
    try {
      const res = await fetch("/cms/api/create-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: shopId,
          template,
          theme,
          payment,
          shipping,
          analytics: analyticsProvider
            ? { provider: analyticsProvider, id: analyticsId }
            : undefined,
          pageTitle,
          pageDescription,
          socialImage,
          components,
          pages,
        }),
      });
      json = await res.json();
      if (res.ok) {
        setResult("Shop created successfully");
        setStep(7);
      } else {
        setResult("Failed to create shop");
      }
    } catch {
      setResult(json?.error ?? "Failed to create shop");
    }
    setCreating(false);
  }

  async function deploy() {
    setDeploying(true);
    setDeployResult(null);
    let json: any = null;
    try {
      const res = await fetch("/cms/api/deploy-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shopId, domain }),
      });
      json = await res.json();
      if (res.ok) {
        setDeployResult("Deployment started");
      } else {
        setDeployResult("Deployment failed");
      }
    } catch {
      setDeployResult(json?.error ?? "Deployment failed");
    }
    setDeploying(false);
  }

  const themeStyle = Object.fromEntries(
    Object.entries(themeVars).map(([k, v]) => [k, v])
  ) as React.CSSProperties;

  return (
    <div className="mx-auto max-w-xl" style={themeStyle}>
      <fieldset disabled={disabled} className="space-y-6">
        <Progress step={step} total={8} />
        {step === 0 && (
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
              <Button disabled={!shopId} onClick={() => setStep(1)}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Theme</h2>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {themes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <WizardPreview style={themeStyle} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => setStep(2)}>Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Customize Tokens</h2>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded border p-2">
              {Object.entries(themeVars).map(([k, v]) => {
                if (k.startsWith("--color")) {
                  return (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <span className="w-40 flex-shrink-0">{k}</span>
                      <input
                        type="color"
                        value={hslToHex(v)}
                        onChange={(e) =>
                          setThemeVars((tv) => ({
                            ...tv,
                            [k]: hexToHsl(e.target.value),
                          }))
                        }
                      />
                    </label>
                  );
                }
                if (k.startsWith("--font")) {
                  const options = k.includes("mono") ? monoFonts : sansFonts;
                  return (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <span className="w-40 flex-shrink-0">{k}</span>
                      <select
                        className="flex-1 rounded border p-1"
                        value={v}
                        onChange={(e) =>
                          setThemeVars((tv) => ({ ...tv, [k]: e.target.value }))
                        }
                      >
                        {options.map((o) => (
                          <option key={o} value={o} style={{ fontFamily: o }}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }
                if (/px$/.test(v)) {
                  const num = parseInt(v, 10);
                  return (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <span className="w-40 flex-shrink-0">{k}</span>
                      <input
                        type="range"
                        min={0}
                        max={64}
                        value={num}
                        onChange={(e) =>
                          setThemeVars((tv) => ({
                            ...tv,
                            [k]: `${e.target.value}px`,
                          }))
                        }
                      />
                      <span className="w-10 text-right">{num}px</span>
                    </label>
                  );
                }
                return (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <span className="w-40 flex-shrink-0">{k}</span>
                    <Input
                      value={v}
                      onChange={(e) =>
                        setThemeVars((tv) => ({ ...tv, [k]: e.target.value }))
                      }
                    />
                  </label>
                );
              })}
            </div>
            <WizardPreview style={themeStyle} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Options</h2>
            <div>
              <p className="font-medium">Payment Providers</p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={payment.includes("stripe")}
                  onCheckedChange={() => setPayment((l) => toggle(l, "stripe"))}
                />
                Stripe
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={payment.includes("paypal")}
                  onCheckedChange={() => setPayment((l) => toggle(l, "paypal"))}
                />
                PayPal
              </label>
            </div>
            <div>
              <p className="font-medium">Shipping Providers</p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={shipping.includes("dhl")}
                  onCheckedChange={() => setShipping((l) => toggle(l, "dhl"))}
                />
                DHL
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={shipping.includes("ups")}
                  onCheckedChange={() => setShipping((l) => toggle(l, "ups"))}
                />
                UPS
              </label>
            </div>
            <div>
              <p className="font-medium">Analytics</p>
              <Select
                value={analyticsProvider}
                onValueChange={setAnalyticsProvider}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="ga">Google Analytics</SelectItem>
                </SelectContent>
              </Select>
              {analyticsProvider === "ga" && (
                <Input
                  className="mt-2"
                  value={analyticsId}
                  onChange={(e) => setAnalyticsId(e.target.value)}
                  placeholder="Measurement ID"
                />
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)}>Next</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Home Page</h2>
            <PageBuilder
              page={
                {
                  id: "",
                  slug: "",
                  status: "draft",
                  components,
                  seo: { title: "", description: "" },
                  createdAt: "",
                  updatedAt: "",
                  createdBy: "",
                } as Page
              }
              onSave={async () => {}}
              onPublish={async () => {}}
              onChange={setComponents}
              style={themeStyle}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button onClick={() => setStep(5)}>Next</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Additional Pages</h2>
            {pages.length > 0 && (
              <ul className="list-disc pl-5 text-sm">
                {pages.map((p) => (
                  <li key={p.slug}>{p.slug}</li>
                ))}
              </ul>
            )}
            {adding && (
              <div className="space-y-2">
                <label className="flex flex-col gap-1">
                  <span>Slug</span>
                  <Input
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Title</span>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Description</span>
                  <Input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Image URL</span>
                  <Input
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                  />
                </label>
                <PageBuilder
                  page={
                    {
                      id: "",
                      slug: "",
                      status: "draft",
                      components: newComponents,
                      seo: { title: "", description: "" },
                      createdAt: "",
                      updatedAt: "",
                      createdBy: "",
                    } as Page
                  }
                  onSave={async () => {}}
                  onPublish={async () => {}}
                  onChange={setNewComponents}
                  style={themeStyle}
                />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setAdding(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setPages((p) => [
                        ...p,
                        {
                          slug: newSlug,
                          title: newTitle,
                          description: newDesc,
                          image: newImage,
                          components: newComponents,
                        },
                      ]);
                      setNewSlug("");
                      setNewTitle("");
                      setNewDesc("");
                      setNewImage("");
                      setNewComponents([]);
                      setAdding(false);
                    }}
                  >
                    Add Page
                  </Button>
                </div>
              </div>
            )}
            {!adding && (
              <Button onClick={() => setAdding(true)}>Add Page</Button>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(4)}>
                Back
              </Button>
              <Button onClick={() => setStep(6)}>Next</Button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Summary</h2>
            <ul className="list-disc pl-5 text-sm">
              <li>
                <b>Shop ID:</b> {shopId}
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
            <label className="flex flex-col gap-1">
              <span>Home page title</span>
              <Input
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Home"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>Description</span>
              <Input
                value={pageDescription}
                onChange={(e) => setPageDescription(e.target.value)}
                placeholder="Page description"
              />
            </label>
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
              <Button variant="outline" onClick={() => setStep(5)}>
                Back
              </Button>
              <Button disabled={creating} onClick={submit}>
                {creating ? "Creating…" : "Create Shop"}
              </Button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Hosting</h2>
            <label className="flex flex-col gap-1">
              <span>Custom Domain</span>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="myshop.example.com"
              />
            </label>
            {deployResult && <p className="text-sm">{deployResult}</p>}
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(6)}>
                Back
              </Button>
              <Button disabled={deploying} onClick={deploy}>
                {deploying ? "Deploying…" : "Deploy"}
              </Button>
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}
