// apps/cms/src/app/cms/wizard/Wizard.tsx
"use client";

import { Progress } from "@/components/atoms";
import { LOCALES, type Locale, type PageComponent } from "@types";

import type { DeployShopResult } from "@platform-core/createShop";
import { useEffect, useRef, useState } from "react";
import { ulid } from "ulid";
import MediaUploadDialog from "./MediaUploadDialog";
import StepLayout from "./steps/StepLayout";

import StepCheckoutPage from "./steps/StepCheckoutPage";
import StepShopPage from "./steps/StepShopPage";
import {
  baseTokens,
  loadThemeTokens,
  resetWizardProgress,
  STORAGE_KEY,
  TokenMap,
} from "./utils";

import StepAdditionalPages from "./steps/StepAdditionalPages";
import StepHomePage from "./steps/StepHomePage";
import StepHosting from "./steps/StepHosting";
import StepImportData from "./steps/StepImportData";
import StepNavigation from "./steps/StepNavigation";
import StepOptions from "./steps/StepOptions";
import StepProductPage from "./steps/StepProductPage";
import StepSeedData from "./steps/StepSeedData";
import StepShopDetails from "./steps/StepShopDetails";
import StepSummary from "./steps/StepSummary";
import StepTheme from "./steps/StepTheme";
import StepTokens from "./steps/StepTokens";

interface Props {
  themes: string[];
  templates: string[];
  disabled?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  url: string;
  children?: NavItem[];
}

export default function Wizard({
  themes,
  templates,
  disabled,
}: Props): React.JSX.Element {
  const [step, setStep] = useState(0);
  const [shopId, setShopId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [logo, setLogo] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [template, setTemplate] = useState(templates[0] ?? "");
  const [theme, setTheme] = useState(themes[0] ?? "");
  const [payment, setPayment] = useState<string[]>([]);
  const [shipping, setShipping] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [themeVars, setThemeVars] = useState<TokenMap>(baseTokens);
  const savedThemeVars = useRef<TokenMap | null>(null);
  const [domain, setDomain] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<string | null>(null);
  const [deployInfo, setDeployInfo] = useState<
    DeployShopResult | { status: "pending" } | null
  >(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

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

  const [pageTemplates, setPageTemplates] = useState<
    Array<{ name: string; components: PageComponent[] }>
  >([]);
  const [homeLayout, setHomeLayout] = useState("");
  const [newPageLayout, setNewPageLayout] = useState("");
  const [productLayout, setProductLayout] = useState("");
  const [shopLayout, setShopLayout] = useState("");

  const [components, setComponents] = useState<PageComponent[]>([]);
  const [homePageId, setHomePageId] = useState<string | null>(null);
  const [shopComponents, setShopComponents] = useState<PageComponent[]>([]);
  const [shopPageId, setShopPageId] = useState<string | null>(null);
  const [productComponents, setProductComponents] = useState<PageComponent[]>(
    []
  );
  const [productPageId, setProductPageId] = useState<string | null>(null);

  const [checkoutLayout, setCheckoutLayout] = useState("");
  const [checkoutComponents, setCheckoutComponents] = useState<PageComponent[]>(
    []
  );
  const [checkoutPageId, setCheckoutPageId] = useState<string | null>(null);

  const [headerComponents, setHeaderComponents] = useState<PageComponent[]>([]);
  const [headerPageId, setHeaderPageId] = useState<string | null>(null);
  const [footerComponents, setFooterComponents] = useState<PageComponent[]>([]);
  const [footerPageId, setFooterPageId] = useState<string | null>(null);

  const [analyticsProvider, setAnalyticsProvider] = useState("");
  const [analyticsId, setAnalyticsId] = useState("");

  const [navItems, setNavItems] = useState<NavItem[]>([
    { id: ulid(), label: "Shop", url: "/shop" },
  ]);

  const [pages, setPages] = useState<
    Array<{
      id?: string;
      slug: string;
      title: Record<Locale, string>;
      description: Record<Locale, string>;
      image: Record<Locale, string>;
      components: PageComponent[];
    }>
  >([]);

  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState<Record<Locale, string>>(() => {
    const obj = {} as Record<Locale, string>;
    languages.forEach((l) => {
      obj[l] = "";
    });
    return obj;
  });
  const [newDesc, setNewDesc] = useState<Record<Locale, string>>(() => {
    const obj = {} as Record<Locale, string>;
    languages.forEach((l) => {
      obj[l] = "";
    });
    return obj;
  });
  const [newImage, setNewImage] = useState<Record<Locale, string>>(() => {
    const obj = {} as Record<Locale, string>;
    languages.forEach((l) => {
      obj[l] = "";
    });
    return obj;
  });
  const [newComponents, setNewComponents] = useState<PageComponent[]>([]);
  const [newDraftId, setNewDraftId] = useState<string | null>(null);
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
    fetch("/cms/api/page-templates")
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setPageTemplates(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return;
    try {
      const data = JSON.parse(json);
      if (typeof data.step === "number") setStep(data.step);
      if (typeof data.shopId === "string") setShopId(data.shopId);
      if (typeof data.storeName === "string") setStoreName(data.storeName);
      if (typeof data.logo === "string") setLogo(data.logo);
      if (typeof data.contactInfo === "string")
        setContactInfo(data.contactInfo);
      if (typeof data.template === "string") setTemplate(data.template);
      if (typeof data.theme === "string") setTheme(data.theme);
      if (Array.isArray(data.payment)) setPayment(data.payment);
      if (Array.isArray(data.shipping)) setShipping(data.shipping);
      if (data.pageTitle) setPageTitle(data.pageTitle);
      if (data.pageDescription) setPageDescription(data.pageDescription);
      if (typeof data.socialImage === "string")
        setSocialImage(data.socialImage);
      if (Array.isArray(data.components)) setComponents(data.components);
      if (Array.isArray(data.headerComponents))
        setHeaderComponents(data.headerComponents);
      if (typeof data.headerPageId === "string")
        setHeaderPageId(data.headerPageId);
      if (Array.isArray(data.footerComponents))
        setFooterComponents(data.footerComponents);
      if (typeof data.footerPageId === "string")
        setFooterPageId(data.footerPageId);
      if (typeof data.homePageId === "string") setHomePageId(data.homePageId);
      if (typeof data.homeLayout === "string") setHomeLayout(data.homeLayout);
      if (Array.isArray(data.shopComponents))
        setShopComponents(data.shopComponents);
      if (typeof data.shopPageId === "string") setShopPageId(data.shopPageId);
      if (typeof data.shopLayout === "string") setShopLayout(data.shopLayout);
      if (Array.isArray(data.productComponents))
        setProductComponents(data.productComponents);
      if (typeof data.productPageId === "string")
        setProductPageId(data.productPageId);
      if (typeof data.productLayout === "string")
        setProductLayout(data.productLayout);
      if (typeof data.checkoutLayout === "string")
        setCheckoutLayout(data.checkoutLayout);
      if (Array.isArray(data.checkoutComponents))
        setCheckoutComponents(data.checkoutComponents);
      if (typeof data.checkoutPageId === "string")
        setCheckoutPageId(data.checkoutPageId);
      if (typeof data.analyticsProvider === "string")
        setAnalyticsProvider(data.analyticsProvider);
      if (typeof data.analyticsId === "string")
        setAnalyticsId(data.analyticsId);
      if (Array.isArray(data.navItems)) {
        const convert = (items: any[]): NavItem[] =>
          items.map((i) => ({
            id: i.id ?? ulid(),
            label: i.label,
            url: i.url,
            children: Array.isArray(i.children)
              ? convert(i.children)
              : undefined,
          }));
        setNavItems(convert(data.navItems));
      }
      if (Array.isArray(data.pages)) setPages(data.pages);
      if (typeof data.newPageLayout === "string")
        setNewPageLayout(data.newPageLayout);
      if (typeof data.domain === "string") setDomain(data.domain);
      if (typeof data.categoriesText === "string")
        setCategoriesText(data.categoriesText);
      if (data.themeVars) savedThemeVars.current = data.themeVars;
    } catch {}
  }, []);

  useEffect(() => {
    loadThemeTokens(theme).then((tv) => {
      if (savedThemeVars.current) {
        setThemeVars(savedThemeVars.current);
        savedThemeVars.current = null;
      } else {
        setThemeVars(tv);
      }
    });
  }, [theme]);

  useEffect(() => {
    const data = {
      step,
      shopId,
      template,
      theme,
      themeVars,
      payment,
      shipping,
      pageTitle,
      pageDescription,
      socialImage,
      storeName,
      logo,
      contactInfo,
      components,
      headerComponents,
      headerPageId,
      footerComponents,
      footerPageId,
      homePageId,
      shopComponents,
      shopPageId,
      productComponents,
      productPageId,
      checkoutComponents,
      checkoutPageId,
      homeLayout,
      shopLayout,
      productLayout,
      checkoutLayout,
      analyticsProvider,
      analyticsId,
      navItems,
      pages,
      newPageLayout,
      domain,
      categoriesText,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [
    step,
    shopId,
    storeName,
    logo,
    contactInfo,
    template,
    theme,
    themeVars,
    payment,
    shipping,
    pageTitle,
    pageDescription,
    socialImage,
    components,
    headerComponents,
    headerPageId,
    footerComponents,
    footerPageId,
    homePageId,
    shopComponents,
    shopPageId,
    productComponents,
    productPageId,
    checkoutComponents,
    checkoutPageId,
    analyticsProvider,
    analyticsId,
    navItems,
    pages,
    domain,
    categoriesText,
    homeLayout,
    shopLayout,
    productLayout,
    checkoutLayout,
    newPageLayout,
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
          name: storeName,
          logo,
          contactInfo,
          headerComponents,
          headerPageId,
          footerComponents,
          footerPageId,
          options: {
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
            navItems,
            pages,
            checkoutPage: checkoutComponents,
          },
        }),
      });

      if (res.ok) {
        setResult("Shop created successfully");
        setStep(9);
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
      const json = (await res.json()) as
        | DeployShopResult
        | { status: "pending" };
      if (res.ok) {
        setDeployResult("Deployment started");
        setDeployInfo(json);
        startPolling();
      } else {
        setDeployResult((json as any)?.error ?? "Deployment failed");
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
        const status = (await res.json()) as
          | DeployShopResult
          | { status: "pending" };

        setDeployInfo(status);

        if (status.status !== "pending") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {}
    }, 3000);
  }

  const themeStyle = Object.fromEntries(
    Object.entries(themeVars).map(([k, v]) => [k, v])
  ) as React.CSSProperties;

  return (
    <div className="mx-auto max-w-xl" style={themeStyle}>
      <fieldset disabled={disabled} className="space-y-6">
        <div className="flex items-center justify-between">
          <Progress step={step} total={14} />
          {shopId && <MediaUploadDialog shop={shopId} />}
        </div>

        {step === 0 && (
          <StepShopDetails
            shopId={shopId}
            setShopId={setShopId}
            storeName={storeName}
            setStoreName={setStoreName}
            logo={logo}
            setLogo={setLogo}
            contactInfo={contactInfo}
            setContactInfo={setContactInfo}
            template={template}
            setTemplate={setTemplate}
            templates={templates}
            onNext={() => setStep(1)}
          />
        )}

        <StepTheme
          themes={themes}
          theme={theme}
          setTheme={setTheme}
          themeVars={themeVars}
          setThemeVars={setThemeVars}
          themeStyle={themeStyle}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />

        <StepTokens
          themeStyle={themeStyle}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />

        <StepOptions
          payment={payment}
          setPayment={setPayment}
          shipping={shipping}
          setShipping={setShipping}
          analyticsProvider={analyticsProvider}
          setAnalyticsProvider={setAnalyticsProvider}
          analyticsId={analyticsId}
          setAnalyticsId={setAnalyticsId}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />

        <StepNavigation
          navItems={navItems}
          setNavItems={setNavItems}
          onBack={() => setStep(3)}
          onNext={() => setStep(5)}
        />

        {step === 5 && (
          <StepLayout
            headerComponents={headerComponents}
            setHeaderComponents={setHeaderComponents}
            headerPageId={headerPageId}
            setHeaderPageId={setHeaderPageId}
            footerComponents={footerComponents}
            setFooterComponents={setFooterComponents}
            footerPageId={footerPageId}
            setFooterPageId={setFooterPageId}
            shopId={shopId}
            themeStyle={themeStyle}
            onBack={() => setStep(4)}
            onNext={() => setStep(6)}
          />
        )}

        {step === 6 && (
          <StepHomePage
            pageTemplates={pageTemplates}
            homeLayout={homeLayout}
            setHomeLayout={setHomeLayout}
            components={components}
            setComponents={setComponents}
            homePageId={homePageId}
            setHomePageId={setHomePageId}
            shopId={shopId}
            themeStyle={themeStyle}
            onBack={() => setStep(5)}
            onNext={() => setStep(7)}
          />
        )}

        {step === 7 && (
          <StepCheckoutPage
            pageTemplates={pageTemplates}
            checkoutLayout={checkoutLayout}
            setCheckoutLayout={setCheckoutLayout}
            checkoutComponents={checkoutComponents}
            setCheckoutComponents={setCheckoutComponents}
            checkoutPageId={checkoutPageId}
            setCheckoutPageId={setCheckoutPageId}
            shopId={shopId}
            themeStyle={themeStyle}
            onBack={() => setStep(6)}
            onNext={() => setStep(8)}
          />
        )}

        {step === 8 && (
          <StepShopPage
            pageTemplates={pageTemplates}
            shopLayout={shopLayout}
            setShopLayout={setShopLayout}
            shopComponents={shopComponents}
            setShopComponents={setShopComponents}
            shopPageId={shopPageId}
            setShopPageId={setShopPageId}
            shopId={shopId}
            themeStyle={themeStyle}
            onBack={() => setStep(7)}
            onNext={() => setStep(9)}
          />
        )}

        {step === 9 && (
          <StepProductPage
            pageTemplates={pageTemplates}
            productLayout={productLayout}
            setProductLayout={setProductLayout}
            productComponents={productComponents}
            setProductComponents={setProductComponents}
            productPageId={productPageId}
            setProductPageId={setProductPageId}
            shopId={shopId}
            themeStyle={themeStyle}
            onBack={() => setStep(8)}
            onNext={() => setStep(10)}
          />
        )}

        {step === 10 && (
          <StepAdditionalPages
            pageTemplates={pageTemplates}
            pages={pages}
            setPages={setPages}
            newSlug={newSlug}
            setNewSlug={setNewSlug}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newDesc={newDesc}
            setNewDesc={setNewDesc}
            newImage={newImage}
            setNewImage={setNewImage}
            newComponents={newComponents}
            setNewComponents={setNewComponents}
            newDraftId={newDraftId}
            setNewDraftId={setNewDraftId}
            adding={adding}
            setAdding={setAdding}
            newPageLayout={newPageLayout}
            setNewPageLayout={setNewPageLayout}
            shopId={shopId}
            themeStyle={themeStyle}
            onBack={() => setStep(9)}
            onNext={() => setStep(11)}
          />
        )}

        {step === 11 && (
          <StepSummary
            shopId={shopId}
            name={storeName}
            logo={logo}
            contactInfo={contactInfo}
            template={template}
            theme={theme}
            payment={payment}
            shipping={shipping}
            analyticsProvider={analyticsProvider}
            pageTitle={pageTitle}
            setPageTitle={setPageTitle}
            pageDescription={pageDescription}
            setPageDescription={setPageDescription}
            socialImage={socialImage}
            setSocialImage={setSocialImage}
            result={result}
            themeStyle={themeStyle}
            creating={creating}
            submit={submit}
            onBack={() => setStep(10)}
            onNext={() => setStep(12)}
          />
        )}

        {step === 12 && (
          <StepImportData
            csvFile={csvFile}
            setCsvFile={setCsvFile}
            categoriesText={categoriesText}
            setCategoriesText={setCategoriesText}
            importResult={importResult}
            importing={importing}
            saveData={saveData}
            onBack={() => setStep(11)}
            onNext={() => setStep(13)}
          />
        )}

        {step === 13 && (
          <StepSeedData
            csvFile={csvFile}
            setCsvFile={setCsvFile}
            categoriesText={categoriesText}
            setCategoriesText={setCategoriesText}
            seedResult={seedResult}
            seeding={seeding}
            seed={seed}
            onBack={() => setStep(12)}
            onNext={() => setStep(14)}
          />
        )}
        {step === 14 && (
          <StepHosting
            domain={domain}
            setDomain={setDomain}
            deployResult={deployResult}
            deployInfo={deployInfo}
            deploying={deploying}
            deploy={deploy}
            onBack={() => setStep(13)}
          />
        )}
      </fieldset>
    </div>
  );
}
