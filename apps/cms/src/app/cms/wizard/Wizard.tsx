// src/components/cms/Wizard.tsx
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
  Textarea,
} from "@/components/atoms-shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { Footer, Header, SideNav } from "@/components/organisms";
import { AppShell } from "@/components/templates/AppShell";
import TranslationsProvider from "@/i18n/Translations";
import enMessages from "@i18n/en.json";
import type { DeployShopResult } from "@platform-core/createShop";
import { tokens as baseTokensSrc } from "@themes/base/tokens";
import { LOCALES, type Locale, type Page, type PageComponent } from "@types";
import { useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------- */
/*                              Preview component                             */
/* -------------------------------------------------------------------------- */

function WizardPreview({
  style,
}: {
  style: React.CSSProperties;
}): React.JSX.Element {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );

  const widthMap: Record<"desktop" | "tablet" | "mobile", string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const containerStyle = { ...style, width: widthMap[viewport] };
  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant={viewport === "desktop" ? "default" : "outline"}
          onClick={() => setViewport("desktop")}
        >
          Desktop
        </Button>
        <Button
          size="sm"
          variant={viewport === "tablet" ? "default" : "outline"}
          onClick={() => setViewport("tablet")}
        >
          Tablet
        </Button>
        <Button
          size="sm"
          variant={viewport === "mobile" ? "default" : "outline"}
          onClick={() => setViewport("mobile")}
        >
          Mobile
        </Button>
      </div>
      <div style={containerStyle} className="mx-auto rounded border">
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface Props {
  themes: string[];
  templates: string[];
  disabled?: boolean;
}

type TokenMap = Record<`--${string}`, string>;

/* -------------------------------------------------------------------------- */
/*                                   Utils                                    */
/* -------------------------------------------------------------------------- */

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
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

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

const STORAGE_KEY = "cms-wizard-progress";

export function resetWizardProgress(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Wizard                                   */
/* -------------------------------------------------------------------------- */

export default function Wizard({
  themes,
  templates,
  disabled,
}: Props): React.JSX.Element {
  /* ------------------------------ Step control ----------------------------- */

  const [step, setStep] = useState(0);

  /* ---------------------------- Basic shop data --------------------------- */

  const [shopId, setShopId] = useState("");
  const [template, setTemplate] = useState(templates[0] ?? "");
  const [theme, setTheme] = useState(themes[0] ?? "");
  const [payment, setPayment] = useState<string[]>([]);
  const [shipping, setShipping] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  /* ----------------------------- Theme tokens ----------------------------- */

  const [themeVars, setThemeVars] = useState<TokenMap>(baseTokens);

  /* ------------------------------ Deployment ------------------------------ */

  const [domain, setDomain] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<string | null>(null);
  const [deployInfo, setDeployInfo] = useState<DeployShopResult | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  /* --------------------------- Home‑page metadata -------------------------- */

  const languages = LOCALES as readonly Locale[];

  const [pageTitle, setPageTitle] = useState<Record<Locale, string>>(() => {
    const obj = {} as Record<Locale, string>;
    languages.forEach((l, i) => {
      obj[l] = i === 0 ? "Home" : "";
    });
    return obj;
  });

  const [pageDescription, setPageDescription] = useState<
    Record<Locale, string>
  >(() => {
    const obj = {} as Record<Locale, string>;
    languages.forEach((l) => {
      obj[l] = "";
    });
    return obj;
  });

  const [socialImage, setSocialImage] = useState("");

  /* ------------------------------ Page builder ----------------------------- */

  const [components, setComponents] = useState<PageComponent[]>([]);

  /* ------------------------------- Analytics ------------------------------- */

  const [analyticsProvider, setAnalyticsProvider] = useState("");
  const [analyticsId, setAnalyticsId] = useState("");

  /* ------------------------------- Navigation ------------------------------ */

  const [navItems, setNavItems] = useState<{ label: string; url: string }[]>([
    { label: "Shop", url: "/shop" },
  ]);
  const [newNavLabel, setNewNavLabel] = useState("");
  const [newNavUrl, setNewNavUrl] = useState("");

  /* -------------------------- Additional pages ----------------------------- */

  const [pages, setPages] = useState<
    Array<{
      slug: string;
      title: string;
      description: string;
      image: string;
      components: PageComponent[];
    }>
  >([]);

  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newComponents, setNewComponents] = useState<PageComponent[]>([]);
  const [adding, setAdding] = useState(false);

  /* ------------------------- Import / seed data ---------------------------- */

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [categoriesText, setCategoriesText] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /*                                  Effects                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return;
    try {
      const data = JSON.parse(json);
      if (typeof data.step === "number") setStep(data.step);
      if (typeof data.shopId === "string") setShopId(data.shopId);
      if (typeof data.template === "string") setTemplate(data.template);
      if (typeof data.theme === "string") setTheme(data.theme);
      if (Array.isArray(data.payment)) setPayment(data.payment);
      if (Array.isArray(data.shipping)) setShipping(data.shipping);
      if (data.pageTitle) setPageTitle(data.pageTitle);
      if (data.pageDescription) setPageDescription(data.pageDescription);
      if (typeof data.socialImage === "string")
        setSocialImage(data.socialImage);
      if (Array.isArray(data.components)) setComponents(data.components);
      if (typeof data.analyticsProvider === "string")
        setAnalyticsProvider(data.analyticsProvider);
      if (typeof data.analyticsId === "string")
        setAnalyticsId(data.analyticsId);
      if (Array.isArray(data.navItems)) setNavItems(data.navItems);
      if (Array.isArray(data.pages)) setPages(data.pages);
      if (typeof data.domain === "string") setDomain(data.domain);
      if (typeof data.categoriesText === "string")
        setCategoriesText(data.categoriesText);
    } catch {
      // ignore malformed data
    }
  }, []);

  useEffect(() => {
    loadThemeTokens(theme).then(setThemeVars);
  }, [theme]);

  useEffect(() => {
    const data = {
      step,
      shopId,
      template,
      theme,
      payment,
      shipping,
      pageTitle,
      pageDescription,
      socialImage,
      components,
      analyticsProvider,
      analyticsId,
      navItems,
      pages,
      domain,
      categoriesText,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore write errors */
    }
  }, [
    step,
    shopId,
    template,
    theme,
    payment,
    shipping,
    pageTitle,
    pageDescription,
    socialImage,
    components,
    analyticsProvider,
    analyticsId,
    navItems,
    pages,
    domain,
    categoriesText,
  ]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                                 Handlers                                 */
  /* ------------------------------------------------------------------------ */

  async function submit() {
    setCreating(true);
    setResult(null);

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
          navigation: navItems,
          components,
          pages,
        }),
      });

      if (res.ok) {
        setResult("Shop created successfully");
        setStep(8);
        resetWizardProgress();
      } else {
        const { error } = (await res.json()) as { error?: string };
        setResult(error ?? "Failed to create shop");
      }
    } catch {
      setResult("Failed to create shop");
    } finally {
      setCreating(false);
    }
  }

  async function deploy() {
    setDeploying(true);
    setDeployResult(null);

    try {
      const res = await fetch("/cms/api/deploy-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shopId, domain }),
      });
      const json = (await res.json()) as DeployShopResult & { status?: string };

      if (res.ok) {
        setDeployResult("Deployment started");
        setDeployInfo(json);
        startPolling();
      } else {
        setDeployResult(json?.error ?? "Deployment failed");
      }
    } catch {
      setDeployResult("Deployment failed");
    } finally {
      setDeploying(false);
    }
  }

  async function seed() {
    setSeeding(true);
    setSeedResult(null);

    try {
      if (csvFile) {
        const fd = new FormData();
        fd.append("file", csvFile);
        await fetch(`/cms/api/upload-csv/${shopId}`, {
          method: "POST",
          body: fd,
        });
      }

      if (categoriesText.trim()) {
        const cats = categoriesText
          .split(/[\n,]+/)
          .map((c) => c.trim())
          .filter(Boolean);
        await fetch(`/cms/api/categories/${shopId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cats),
        });
      }

      setSeedResult("Data saved");
      setStep(10);
    } catch {
      setSeedResult("Failed to save data");
    } finally {
      setSeeding(false);
    }
  }

  async function saveData() {
    setImporting(true);
    setImportResult(null);

    try {
      if (csvFile) {
        const form = new FormData();
        form.append("file", csvFile);
        await fetch(`/cms/api/import-products/${shopId}`, {
          method: "POST",
          body: form,
        });
      }

      if (categoriesText.trim()) {
        const cats = JSON.parse(categoriesText);
        await fetch(`/cms/api/categories/${shopId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cats),
        });
      }

      setImportResult("Saved");
      setStep(9);
    } catch {
      setImportResult("Failed to save data");
    } finally {
      setImporting(false);
    }
  }

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/cms/api/deploy-shop?id=${shopId}`);
        const status = (await res.json()) as DeployShopResult & {
          status?: string;
        };

        setDeployInfo(status);

        if (status.status && status.status !== "pending") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
  }

  /* ------------------------------------------------------------------------ */
  /*                                  Styles                                  */
  /* ------------------------------------------------------------------------ */

  const themeStyle = Object.fromEntries(
    Object.entries(themeVars).map(([k, v]) => [k, v])
  ) as React.CSSProperties;

  /* ------------------------------------------------------------------------ */
  /*                                   JSX                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="mx-auto max-w-xl" style={themeStyle}>
      <fieldset disabled={disabled} className="space-y-6">
        <Progress step={step} total={11} />

        {/* ------------------------------------------------------------------ */}
        {/*                          Step 0 · Shop ID                           */}
        {/* ------------------------------------------------------------------ */}
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

        {/* ------------------------------------------------------------------ */}
        {/*                       Step 1 · Choose theme                         */}
        {/* ------------------------------------------------------------------ */}
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

        {/* ------------------------------------------------------------------ */}
        {/*                     Step 2 · Customize tokens                       */}
        {/* ------------------------------------------------------------------ */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Customize Tokens</h2>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded border p-2">
              {Object.entries(themeVars).map(([k, v]) => {
                /* Colours -------------------------------------------------- */
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

                /* Fonts ----------------------------------------------------- */
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

                /* Numbers --------------------------------------------------- */
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

                /* Fallback -------------------------------------------------- */
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

        {/* ------------------------------------------------------------------ */}
        {/*                        Step 3 · Options                             */}
        {/* ------------------------------------------------------------------ */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Options</h2>

            {/* Payment providers ------------------------------------------ */}
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

            {/* Shipping providers ----------------------------------------- */}
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

            {/* Analytics --------------------------------------------------- */}
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

            {/* Navigation -------------------------------------------------- */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)}>Next</Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                       Step 4 · Navigation                           */}
        {/* ------------------------------------------------------------------ */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Navigation</h2>

            {navItems.length > 0 && (
              <ul className="list-disc pl-5 text-sm">
                {navItems.map((n) => (
                  <li key={n.url}>
                    {n.label} – {n.url}
                  </li>
                ))}
              </ul>
            )}

            <label className="flex flex-col gap-1">
              <span>Label</span>
              <Input
                value={newNavLabel}
                onChange={(e) => setNewNavLabel(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span>URL</span>
              <Input
                value={newNavUrl}
                onChange={(e) => setNewNavUrl(e.target.value)}
                placeholder="/about"
              />
            </label>

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNewNavLabel("");
                  setNewNavUrl("");
                  setStep(3);
                }}
              >
                Back
              </Button>

              <Button
                onClick={() => {
                  if (newNavLabel && newNavUrl) {
                    setNavItems((n) => [
                      ...n,
                      { label: newNavLabel, url: newNavUrl },
                    ]);
                    setNewNavLabel("");
                    setNewNavUrl("");
                  }
                  setStep(5);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                       Step 5 · Home page                            */}
        {/* ------------------------------------------------------------------ */}
        {step === 5 && (
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
              <Button variant="outline" onClick={() => setStep(4)}>
                Back
              </Button>
              <Button onClick={() => setStep(6)}>Next</Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                    Step 6 · Additional pages                        */}
        {/* ------------------------------------------------------------------ */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Additional Pages</h2>

            {pages.length > 0 && (
              <ul className="list-disc pl-5 text-sm">
                {pages.map((p) => (
                  <li key={p.slug}>{p.slug}</li>
                ))}
              </ul>
            )}

            {/* Page‑builder for new page ---------------------------------- */}
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
              <Button variant="outline" onClick={() => setStep(5)}>
                Back
              </Button>
              <Button onClick={() => setStep(7)}>Next</Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                    Step 7 · Summary & create                        */}
        {/* ------------------------------------------------------------------ */}
        {step === 7 && (
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

            {languages.map((l) => (
              <div key={l} className="space-y-2">
                <label className="flex flex-col gap-1">
                  <span>Home page title ({l})</span>
                  <Input
                    value={pageTitle[l]}
                    onChange={(e) =>
                      setPageTitle((t) => ({ ...t, [l]: e.target.value }))
                    }
                    placeholder="Home"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span>Description ({l})</span>
                  <Input
                    value={pageDescription[l]}
                    onChange={(e) =>
                      setPageDescription((d) => ({ ...d, [l]: e.target.value }))
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
              <Button variant="outline" onClick={() => setStep(6)}>
                Back
              </Button>
              <Button disabled={creating} onClick={submit}>
                {creating ? "Creating…" : "Create Shop"}
              </Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                      Step 8 · Import data                            */}
        {/* ------------------------------------------------------------------ */}
        {step === 8 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Import Data</h2>

            <label className="flex flex-col gap-1">
              <span>Products CSV</span>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <Textarea
              label="Categories JSON"
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
              placeholder='["Shoes","Accessories"]'
            />

            {importResult && <p className="text-sm">{importResult}</p>}

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(7)}>
                Back
              </Button>
              <Button disabled={importing} onClick={saveData}>
                {importing ? "Saving…" : "Save & Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                      Step 9 · Seed data                              */}
        {/* ------------------------------------------------------------------ */}
        {step === 9 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Seed Data</h2>

            <label className="flex flex-col gap-1">
              <span>Product CSV</span>
              <Input
                type="file"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span>Categories (comma or newline separated)</span>
              <Input
                value={categoriesText}
                onChange={(e) => setCategoriesText(e.target.value)}
                placeholder="Shoes, Shirts, Accessories"
              />
            </label>

            {seedResult && <p className="text-sm">{seedResult}</p>}

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(8)}>
                Back
              </Button>
              <Button disabled={seeding} onClick={seed}>
                {seeding ? "Saving…" : "Save & Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                      Step 10 · Hosting                               */}
        {/* ------------------------------------------------------------------ */}
        {step === 10 && (
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

            {deployInfo?.previewUrl && (
              <p className="text-sm">
                Preview:{" "}
                <a
                  href={deployInfo.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  {deployInfo.previewUrl}
                </a>
              </p>
            )}

            {deployInfo?.instructions && (
              <p className="text-sm">{deployInfo.instructions}</p>
            )}

            {deployInfo?.status === "success" && (
              <p className="text-sm text-green-600">Deployment complete</p>
            )}

            {deployInfo?.status === "error" && deployInfo.error && (
              <p className="text-sm text-red-600">{deployInfo.error}</p>
            )}

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(9)}>
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
