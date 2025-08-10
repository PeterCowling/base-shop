// apps/cms/src/app/cms/wizard/Wizard.tsx
"use client";

import { Progress, Toast } from "@/components/atoms";
import { LOCALES } from "@acme/i18n";
import type { DeployShopResult } from "@platform-core/createShop";
import { validateShopName } from "@platform-core/src/shops";
import type { Locale, PageComponent } from "@types";
import { useEffect, useRef, useState } from "react";
import { ulid } from "ulid";

/* -------------------------------------------------------------------------- */
/*  Wizard step views                                                         */
/* -------------------------------------------------------------------------- */
import MediaUploadDialog from "./MediaUploadDialog";
import StepAdditionalPages from "./steps/StepAdditionalPages";
import StepCheckoutPage from "./steps/StepCheckoutPage";
import StepHomePage from "./steps/StepHomePage";
import StepHosting from "./steps/StepHosting";
import StepImportData from "./steps/StepImportData";
import StepLayout from "./steps/StepLayout";
import StepNavigation from "./steps/StepNavigation";
import StepOptions from "./steps/StepOptions";
import StepProductPage from "./steps/StepProductPage";
import StepSeedData from "./steps/StepSeedData";
import StepShopDetails from "./steps/StepShopDetails";
import StepShopPage from "./steps/StepShopPage";
import StepSummary from "./steps/StepSummary";
import StepTheme from "./steps/StepTheme";
import StepTokens from "./steps/StepTokens";

/* -------------------------------------------------------------------------- */
/*  Schema / utils                                                            */
/* -------------------------------------------------------------------------- */
import type { PageInfo } from "./schema";
import { wizardStateSchema } from "./schema";
import { baseTokens, loadThemeTokens, type TokenMap } from "./tokenUtils";
import {
  resetWizardProgress,
  STORAGE_KEY,
} from "./hooks/useWizardPersistence";

/* -------------------------------------------------------------------------- */
/*  Services                                                                  */
/* -------------------------------------------------------------------------- */
import { submitShop } from "./services/submitShop";
import { seedShop } from "./services/seedShop";
import { deployShop } from "./services/deployShop";

/* ========================================================================== */
/*  Types                                                                     */
/* ========================================================================== */

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

/* ========================================================================== */
/*  Wizard Component                                                          */
/* ========================================================================== */

export default function Wizard({
  themes,
  templates,
  disabled,
}: Props): React.JSX.Element {
  /* ---------------------------------------------------------------------- */
  /*  Progress & basic shop details                                         */
  /* ---------------------------------------------------------------------- */
  const [step, setStep] = useState(0);
  const [shopId, setShopId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [logo, setLogo] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  /* ---------------------------------------------------------------------- */
  /*  Theme / template                                                      */
  /* ---------------------------------------------------------------------- */
  const [template, setTemplate] = useState(templates[0] ?? "");
  const [theme, setTheme] = useState(themes[0] ?? "base");
  const [themeVars, setThemeVars] = useState<TokenMap>(baseTokens);
  const savedThemeVars = useRef<TokenMap | null>(null);

  /* ---------------------------------------------------------------------- */
  /*  Payment / shipping / analytics                                        */
  /* ---------------------------------------------------------------------- */
  const [payment, setPayment] = useState<string[]>([]);
  const [shipping, setShipping] = useState<string[]>([]);
  const [analyticsProvider, setAnalyticsProvider] = useState("");
  const [analyticsId, setAnalyticsId] = useState("");

  /* ---------------------------------------------------------------------- */
  /*  Submission & deploy status                                            */
  /* ---------------------------------------------------------------------- */
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [domain, setDomain] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<string | null>(null);
  const [deployInfo, setDeployInfo] = useState<
    DeployShopResult | { status: "pending"; error?: string } | null
  >(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  /* ---------------------------------------------------------------------- */
  /*  SEO fields                                                            */
  /* ---------------------------------------------------------------------- */
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
  >(() =>
    languages.reduce<Record<Locale, string>>(
      (acc, l) => {
        acc[l] = "";
        return acc;
      },
      {} as Record<Locale, string>
    )
  );

  const [socialImage, setSocialImage] = useState("");

  /* ---------------------------------------------------------------------- */
  /*  Page‑builder / layout state                                           */
  /* ---------------------------------------------------------------------- */
  const [pageTemplates, setPageTemplates] = useState<
    Array<{ name: string; components: PageComponent[] }>
  >([]);

  const [homeLayout, setHomeLayout] = useState("");
  const [productLayout, setProductLayout] = useState("");
  const [shopLayout, setShopLayout] = useState("");
  const [checkoutLayout, setCheckoutLayout] = useState("");

  const [components, setComponents] = useState<PageComponent[]>([]);
  const [homePageId, setHomePageId] = useState<string | null>(null);

  const [shopComponents, setShopComponents] = useState<PageComponent[]>([]);
  const [shopPageId, setShopPageId] = useState<string | null>(null);

  const [productComponents, setProductComponents] = useState<PageComponent[]>(
    []
  );
  const [productPageId, setProductPageId] = useState<string | null>(null);

  const [checkoutComponents, setCheckoutComponents] = useState<PageComponent[]>(
    []
  );
  const [checkoutPageId, setCheckoutPageId] = useState<string | null>(null);

  const [headerComponents, setHeaderComponents] = useState<PageComponent[]>([]);
  const [headerPageId, setHeaderPageId] = useState<string | null>(null);

  const [footerComponents, setFooterComponents] = useState<PageComponent[]>([]);
  const [footerPageId, setFooterPageId] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /*  Navigation & dynamic pages                                            */
  /* ---------------------------------------------------------------------- */
  const [navItems, setNavItems] = useState<NavItem[]>([
    { id: ulid(), label: "Shop", url: "https://example.com/shop" },
  ]);

  const [pages, setPages] = useState<PageInfo[]>([]);


  /* ---------------------------------------------------------------------- */
  /*  Import / seed data                                                    */
  /* ---------------------------------------------------------------------- */
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [categoriesText, setCategoriesText] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /*  Miscellaneous                                                         */
  /* ---------------------------------------------------------------------- */
  const [invalidStateNotice, setInvalidStateNotice] = useState(false);

  /* ====================================================================== */
  /*  Effects                                                               */
  /* ====================================================================== */

  /**
   * Lazy‑load page templates **after** the wizard reaches the first page
   * layout step (step ≥ 6).  This avoids an early network call that breaks
   * unit tests, while still ensuring templates are available when required.
   */
  useEffect(() => {
    if (step >= 6 && pageTemplates.length === 0) {
      fetch("/cms/api/page-templates")
        .then((res) => res.json())
        .then((data) => Array.isArray(data) && setPageTemplates(data))
        .catch(() => {});
    }
  }, [step, pageTemplates.length]);

  /* --- restore wizard state from localStorage on mount --- */
  useEffect(() => {
    const json = localStorage.getItem(STORAGE_KEY);
    if (json) {
      try {
        const raw = JSON.parse(json);
        const parsed = wizardStateSchema.safeParse(raw);
        if (parsed.success) {
          const data = parsed.data;

          /* progress & shop info */
          setStep(data.step);
          setShopId(data.shopId);
          setStoreName(data.storeName);
          setLogo(data.logo);
          setContactInfo(data.contactInfo);

          /* theme / template */
          setTemplate(data.template);
          setTheme(data.theme);
          savedThemeVars.current = data.themeVars;

          /* commerce */
          setPayment(data.payment);
          setShipping(data.shipping);

          /* SEO */
          setPageTitle(data.pageTitle);
          setPageDescription(data.pageDescription);
          setSocialImage(data.socialImage);

          /* layout pools */
          setComponents(data.components);
          setHeaderComponents(data.headerComponents);
          setHeaderPageId(data.headerPageId);
          setFooterComponents(data.footerComponents);
          setFooterPageId(data.footerPageId);
          setHomePageId(data.homePageId);
          setHomeLayout(data.homeLayout);
          setShopComponents(data.shopComponents);
          setShopPageId(data.shopPageId);
          setShopLayout(data.shopLayout);
          setProductComponents(data.productComponents);
          setProductPageId(data.productPageId);
          setProductLayout(data.productLayout);
          setCheckoutLayout(data.checkoutLayout);
          setCheckoutComponents(data.checkoutComponents);
          setCheckoutPageId(data.checkoutPageId);

          /* analytics */
          setAnalyticsProvider(data.analyticsProvider);
          setAnalyticsId(data.analyticsId);

          /* navigation & dynamic pages */
          setNavItems(data.navItems as NavItem[]);
          setPages(data.pages);

          /* misc */
          setDomain(data.domain);
          setCategoriesText(data.categoriesText);
        } else {
          console.warn("Stored wizard state failed validation", parsed.error);
          resetWizardProgress();
          setInvalidStateNotice(true);
        }
      } catch (err) {
        console.warn("Failed to parse wizard state", err);
      }
    }
  }, []);

  /* --- load theme tokens whenever the theme changes --- */
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

  /* --- persist wizard state to localStorage on every relevant change --- */
  useEffect(() => {
    const data = {
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
      homeLayout,
      shopLayout,
      productLayout,
      checkoutLayout,
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
      /* ignore quota or serialisation errors */
    }
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
  ]);

  /* --- clear polling timer when unmounting --- */
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  /* ====================================================================== */
  /*  Action handlers                                                       */
  /* ====================================================================== */

  async function submit() {
    setCreating(true);
    setResult(null);
    setFieldErrors({});
    try {
      const payload = {
        storeName,
        logo,
        contactInfo,
        template,
        theme,
        payment,
        shipping,
        pageTitle,
        pageDescription,
        socialImage,
        navItems,
        pages,
        checkoutComponents,
        analyticsProvider,
        analyticsId,
      };

      const { ok, error, fieldErrors } = await submitShop(shopId, payload);

      if (ok) {
        setResult("Shop created successfully");
        /* Remain on the summary step so the success message is visible;
           navigation to the next step is left to the user. */
        resetWizardProgress();
      } else {
        if (fieldErrors) setFieldErrors(fieldErrors);
        setResult(error ?? "Failed to create shop");
      }
    } catch (err) {
      console.error("Error creating shop", err);
      setResult(err instanceof Error ? err.message : "Failed to create shop");
    } finally {
      setCreating(false);
    }
  }

  async function deploy() {
    setDeploying(true);
    setDeployResult(null);
    try {
      const { ok, info, error } = await deployShop(shopId, domain);
      if (ok) {
        setDeployResult("Deployment started");
        if (info) setDeployInfo(info);
        startPolling();
      } else {
        setDeployResult(error ?? "Deployment failed");
      }
    } catch (err) {
      console.error("Error deploying shop", err);
      setDeployResult(err instanceof Error ? err.message : "Deployment failed");
    } finally {
      setDeploying(false);
    }
  }

  async function seed() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const { ok, error } = await seedShop(
        shopId,
        csvFile ?? undefined,
        categoriesText
      );

      if (ok) {
        setSeedResult("Data saved");
        setStep(10);
      } else {
        setSeedResult(error ?? "Failed to save data");
      }
    } catch (err) {
      console.error("Error saving seed data", err);
      setSeedResult(err instanceof Error ? err.message : "Failed to save data");
    } finally {
      setSeeding(false);
    }
  }

  async function saveData() {
    setImporting(true);
    setImportResult(null);

    try {
      validateShopName(shopId);
      if (csvFile) {
        const form = new FormData();
        form.append("file", csvFile);
        const res = await fetch(`/cms/api/import-products/${shopId}`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "Failed to save data");
        }
      }

      if (categoriesText.trim()) {
        const cats = JSON.parse(categoriesText);
        const res = await fetch(`/cms/api/categories/${shopId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cats),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "Failed to save data");
        }
      }

      setImportResult("Saved");
      setStep(9);
    } catch (err) {
      console.error("Error importing data", err);
      setImportResult(
        err instanceof Error ? err.message : "Failed to save data"
      );
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
          | { status: "pending"; error?: string };

        setDeployInfo(status);

        if (status.status !== "pending") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (err) {
        console.error("Polling deploy status failed", err);
      }
    }, 3000);
  }

  /* ====================================================================== */
  /*  Presentation helpers                                                  */
  /* ====================================================================== */

  const themeStyle = Object.fromEntries(
    Object.entries(themeVars).map(([k, v]) => [k, v])
  ) as React.CSSProperties;

  function handleIdStepNext() {
    try {
      validateShopName(shopId);
      setFieldErrors((prev) => {
        const { id, ...rest } = prev;
        return rest;
      });
      setStep(1);
    } catch (err) {
      setFieldErrors((prev) => ({
        ...prev,
        id: [err instanceof Error ? err.message : String(err)],
      }));
    }
  }

  /** Returns the JSX for the current step—only that step is mounted. */
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
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
            onNext={handleIdStepNext}
            errors={fieldErrors}
          />
        );

      case 1:
        return (
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
        );

      case 2:
        return (
          <StepTokens
            themeStyle={themeStyle}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        );

      case 3:
        return (
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
        );

      case 4:
        return (
          <StepNavigation
            navItems={navItems}
            setNavItems={setNavItems}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        );

      case 5:
        return (
          <StepLayout
            currentStep={step}
            stepIndex={5}
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
        );

      case 6:
        return (
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
        );

      case 7:
        return (
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
        );

      case 8:
        return (
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
        );

      case 9:
        return (
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
        );

      case 10:
        return (
          <StepAdditionalPages
            pageTemplates={pageTemplates}
            pages={pages}
            setPages={setPages}
            shopId={shopId}
            themeStyle={themeStyle}
            onBack={() => setStep(9)}
            onNext={() => setStep(11)}
          />
        );

      case 11:
        return (
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
            errors={fieldErrors}
          />
        );

      case 12:
        return (
          <StepImportData
            setCsvFile={setCsvFile}
            categoriesText={categoriesText}
            setCategoriesText={setCategoriesText}
            importResult={importResult}
            importing={importing}
            saveData={saveData}
            onBack={() => setStep(11)}
          />
        );

      case 13:
        return (
          <StepSeedData
            setCsvFile={setCsvFile}
            categoriesText={categoriesText}
            setCategoriesText={setCategoriesText}
            seedResult={seedResult}
            seeding={seeding}
            seed={seed}
            onBack={() => setStep(12)}
          />
        );

      case 14:
        return (
          <StepHosting
            domain={domain}
            setDomain={setDomain}
            deployResult={deployResult}
            deployInfo={deployInfo}
            deploying={deploying}
            deploy={deploy}
            onBack={() => setStep(13)}
          />
        );

      default:
        return null;
    }
  };

  /* ====================================================================== */
  /*  JSX                                                                   */
  /* ====================================================================== */

  return (
    <div className="mx-auto max-w-xl" style={themeStyle}>
      <fieldset disabled={disabled} className="space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <Progress step={step} total={14} />
          {shopId && <MediaUploadDialog shop={shopId} />}
        </div>

        {/* Only the active step is rendered */}
        {renderStep()}
      </fieldset>

      <Toast
        open={invalidStateNotice}
        onClose={() => setInvalidStateNotice(false)}
        message="Saved wizard state was invalid and has been reset."
      />
    </div>
  );
}
