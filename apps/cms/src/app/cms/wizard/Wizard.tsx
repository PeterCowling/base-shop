// apps/cms/src/app/cms/wizard/Wizard.tsx
"use client";

import { Progress, Toast } from "@/components/atoms";
import { LOCALES } from "@acme/i18n";
import type { DeployShopResult } from "@platform-core/createShop";
import { validateShopName } from "@platform-core/src/shops";
import type { Locale, PageComponent } from "@types";
import { useCallback, useEffect, useRef, useState } from "react";
import { ulid } from "ulid";

/* -------------------------------------------------------------------------- */
/*  Wizard step views                                                         */
/* -------------------------------------------------------------------------- */
import MediaUploadDialog from "./MediaUploadDialog";
import steps from "../configurator/steps";

/* -------------------------------------------------------------------------- */
/*  Schema / utils                                                            */
/* -------------------------------------------------------------------------- */
import type { PageInfo, WizardState } from "./schema";
import { baseTokens, loadThemeTokens, type TokenMap } from "./tokenUtils";
import { resetWizardProgress, useWizardPersistence } from "./hooks/useWizardPersistence";

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
  const [type, setType] = useState<"sale" | "rental">("sale");

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
  /*  Environment variables                                                 */
  /* ---------------------------------------------------------------------- */
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const setEnv = (key: string, value: string) =>
    setEnvVars((prev) => ({ ...prev, [key]: value }));

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
  const pollRetries = useRef(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [completed, setCompleted] = useState<Record<string, boolean>>({});

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

  /* --- hydrate & persist wizard state via server --- */
  const hydrate = useCallback((data: WizardState) => {
    setStep(data.step);
    setShopId(data.shopId);
    setStoreName(data.storeName);
    setLogo(data.logo);
    setContactInfo(data.contactInfo);
    setType(data.type);
    setTemplate(data.template);
    setTheme(data.theme);
    savedThemeVars.current = data.themeVars;
    setPayment(data.payment);
    setShipping(data.shipping);
    setPageTitle(data.pageTitle);
    setPageDescription(data.pageDescription);
    setSocialImage(data.socialImage);
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
    setAnalyticsProvider(data.analyticsProvider);
    setAnalyticsId(data.analyticsId);
    setNavItems(data.navItems as NavItem[]);
    setPages(data.pages);
    setEnvVars(data.env);
    setDomain(data.domain);
    setCategoriesText(data.categoriesText);
  }, []);

  useWizardPersistence(
    {
      step,
      shopId,
      storeName,
      logo,
      contactInfo,
      type,
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
    },
    hydrate,
    () => setInvalidStateNotice(true)
  );

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


  /* --- clear polling timer when unmounting --- */
  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
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
        type,
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
        env: envVars,
      };

      const { ok, error, fieldErrors, deployment } = await submitShop(
        shopId,
        payload
      );

      if (ok) {
        setResult(
          "Shop created successfully. You now have ShopAdmin access and can manage the shop from the CMS dashboard."
        );
        if (deployment && deployment.status !== "pending") {
          setDeployInfo(deployment as DeployShopResult);
        }
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
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRetries.current = 0;

    const poll = async () => {
      try {
        const res = await fetch(`/cms/api/deploy-shop?id=${shopId}`);
        if (!res.ok) {
          console.error(
            `Polling deploy status failed: ${res.status} ${res.statusText}`,
          );
          pollRetries.current += 1;
          if (pollRetries.current >= 3) {
            setDeployInfo({
              status: "error",
              error: `Polling failed with status ${res.status}`,
            });
            pollRef.current = null;
            return;
          }
        } else {
          const status = (await res.json()) as
            | DeployShopResult
            | { status: "pending"; error?: string };

          setDeployInfo(status);

          if (status.status !== "pending") {
            pollRef.current = null;
            return;
          }

          pollRetries.current = 0;
        }
      } catch (err) {
        console.error("Polling deploy status failed", err);
        pollRetries.current += 1;
        if (pollRetries.current >= 3) {
          setDeployInfo({
            status: "error",
            error: "Polling failed due to network error",
          });
          pollRef.current = null;
          return;
        }
      }

      const delay = Math.min(3000 * 2 ** pollRetries.current, 30000);
      pollRef.current = setTimeout(poll, delay);
    };

    poll();
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

  const layoutIndex = steps.findIndex((s) => s.id === "layout");

  const stepProps: Record<string, any> = {
    "shop-details": {
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
      errors: fieldErrors,
    },
    theme: {
      themes,
      theme,
      setTheme,
      themeVars,
      setThemeVars,
      themeStyle,
    },
    tokens: { themeStyle },
    options: {
      shopId,
      payment,
      setPayment,
      shipping,
      setShipping,
      analyticsProvider,
      setAnalyticsProvider,
      analyticsId,
      setAnalyticsId,
    },
    navigation: { navItems, setNavItems },
    layout: {
      currentStep: step,
      stepIndex: layoutIndex,
      headerComponents,
      setHeaderComponents,
      headerPageId,
      setHeaderPageId,
      footerComponents,
      setFooterComponents,
      footerPageId,
      setFooterPageId,
      shopId,
      themeStyle,
    },
    "home-page": {
      pageTemplates,
      homeLayout,
      setHomeLayout,
      components,
      setComponents,
      homePageId,
      setHomePageId,
      shopId,
      themeStyle,
    },
    "checkout-page": {
      pageTemplates,
      checkoutLayout,
      setCheckoutLayout,
      checkoutComponents,
      setCheckoutComponents,
      checkoutPageId,
      setCheckoutPageId,
      shopId,
      themeStyle,
    },
    "shop-page": {
      pageTemplates,
      shopLayout,
      setShopLayout,
      shopComponents,
      setShopComponents,
      shopPageId,
      setShopPageId,
      shopId,
      themeStyle,
    },
    "product-page": {
      pageTemplates,
      productLayout,
      setProductLayout,
      productComponents,
      setProductComponents,
      productPageId,
      setProductPageId,
      shopId,
      themeStyle,
    },
    "additional-pages": {
      pageTemplates,
      pages,
      setPages,
      shopId,
      themeStyle,
    },
    "env-vars": { env: envVars, setEnv },
    summary: {
      shopId,
      name: storeName,
      logo,
      contactInfo,
      type,
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
      creating,
      submit,
      errors: fieldErrors,
    },
    "import-data": {
      setCsvFile,
      categoriesText,
      setCategoriesText,
      importResult,
      importing,
      saveData,
    },
    "seed-data": {
      setCsvFile,
      categoriesText,
      setCategoriesText,
      seedResult,
      seeding,
      seed,
    },
    hosting: {
      shopId,
      domain,
      setDomain,
      deployResult,
      deployInfo,
      setDeployInfo,
      deploying,
      deploy,
    },
  };

  const stepsWithNext = new Set([
    "shop-details",
    "theme",
    "tokens",
    "options",
    "navigation",
    "layout",
    "home-page",
    "checkout-page",
    "shop-page",
    "product-page",
    "additional-pages",
    "env-vars",
    "summary",
  ]);

  const currentStepDef = steps[step];
  const StepComponent = currentStepDef.component as any;
  const hasNext = stepsWithNext.has(currentStepDef.id);
  const onNext =
    currentStepDef.id === "shop-details"
      ? handleIdStepNext
      : () => setStep(step + 1);

  const handleComplete = () => {
    setCompleted((prev) => ({ ...prev, [currentStepDef.id]: true }));
    if (!hasNext) {
      setStep(step + 1);
    }
  };

  /* ====================================================================== */
  /*  JSX                                                                   */
  /* ====================================================================== */

  return (
    <div className="mx-auto max-w-xl" style={themeStyle}>
      <fieldset disabled={disabled} className="space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <Progress step={step} total={steps.length} />
          {shopId && <MediaUploadDialog shop={shopId} />}
        </div>

        <StepComponent
          {...stepProps[currentStepDef.id]}
          {...(step > 0 ? { onBack: () => setStep(step - 1) } : {})}
          {...(hasNext ? { onNext } : {})}
          onComplete={handleComplete}
        />
      </fieldset>

      <Toast
        open={invalidStateNotice}
        onClose={() => setInvalidStateNotice(false)}
        message="Saved wizard state was invalid and has been reset."
      />
    </div>
  );
}
