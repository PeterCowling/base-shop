import React, { memo, useEffect, useLayoutEffect } from "react";
import { Outlet, type RouteObject,useOutlet } from "react-router";

import { NotificationBanner } from "@acme/ui/molecules/NotificationBanner";
import { Header } from "@acme/ui/organisms/Header";

import ErrorBoundary from "@/components/ErrorBoundary";
import { Footer } from "@/components/footer/Footer";
import { IS_DEV } from "@/config/env";
import { HelpDrawerProvider } from "@/context/HelpDrawerContext";
import { ModalProvider } from "@/context/ModalContext";
import { BannerProvider } from "@/context/NotificationBannerContext";
import { RatesProvider } from "@/context/RatesContext";
import { useProtectBrandName } from "@/hooks/useProtectBrandName";
import { useWebVitals } from "@/hooks/useWebVitals";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { preloadI18nNamespaces } from "@/utils/loadI18nNs";
import prefetchInteractiveBundles from "@/utils/prefetchInteractive";

import { isSupportedLanguage } from "../config";
import i18n from "../i18n";
import { type AppLanguage,i18nConfig } from "../i18n.config";
import { APP_I18N_NAMESPACES } from "../i18n.namespaces";

import { InlineBoundary } from "./boundaries";
import { getPathname, isTestEnvironment } from "./environment";
import { useSafeLocation } from "./useSafeLocation";

type RootProps = {
  __testOutlets?: RouteObject[];
};

function Root({ __testOutlets }: RootProps): React.JSX.Element {
  useWebVitals();
  useProtectBrandName();

  const location = useSafeLocation();
  const outlet = useOutlet();
  const pathname = location?.pathname ?? getPathname();
  const [maybeLng] = pathname.split("/").filter(Boolean);
  const lang: AppLanguage = isSupportedLanguage(maybeLng)
    ? (maybeLng as AppLanguage)
    : (i18nConfig.fallbackLng as AppLanguage);

  useLayoutEffect(() => {
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang).catch(console.error);
    }
  }, [lang]);

  useEffect(() => {
    const namespaces = APP_I18N_NAMESPACES;

    const loadFor = async (next: string | undefined) => {
      const normalized = (() => {
        const raw = next?.toLowerCase();
        if (!raw) return undefined;
        const base = raw.split("-")[0];
        return isSupportedLanguage(base) ? (base as AppLanguage) : undefined;
      })();

      const targetLang = normalized ?? lang;

      try {
        await preloadI18nNamespaces(targetLang, namespaces, { optional: true });
        if (typeof i18n.emit === "function") {
          i18n.emit("loaded", { [targetLang]: namespaces });
        }
      } catch (error) {
        if (IS_DEV) {
          console.error(error);
        }
      }
    };

    // Always prioritise the language derived from the current route so the
    // initial preload aligns with the rendered locale. If the i18n instance is
    // still pointing at a different language we trigger a secondary preload
    // below to warm its cache as well.
    void loadFor(lang);

    if (i18n.language && i18n.language !== lang) {
      void loadFor(i18n.language);
    }

    const handler = (next: string) => {
      void loadFor(next);
    };

    i18n.on("languageChanged", handler);

    return () => {
      i18n.off("languageChanged", handler);
    };
  }, [lang]);

  useEffect(() => {
    void prefetchInteractiveBundles();
  }, []);

  const isTest = isTestEnvironment;
  const fallbackOutlet =
    !outlet && Array.isArray(__testOutlets)
      ? (__testOutlets.find((child) => child.index)?.element ?? __testOutlets[0]?.element ?? null)
      : null;

  const RatesWrapper = isTest
    ? ({ children }: { children: React.ReactNode }) => <>{children}</>
    : RatesProvider;
  const BannerWrapper = isTest
    ? ({ children }: { children: React.ReactNode }) => <>{children}</>
    : BannerProvider;
  const ModalWrapper = ModalProvider;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <HelpDrawerProvider>
          <RatesWrapper>
            <BannerWrapper>
              <ModalWrapper>
                <span id="top" tabIndex={-1} />
                {!isTest && (
                  <InlineBoundary>
                    <NotificationBanner lang={lang} />
                  </InlineBoundary>
                )}
                <InlineBoundary>
                  <Header lang={lang} />
                </InlineBoundary>
                <main className="pt-16 lg:pt-0">{outlet ?? fallbackOutlet ?? <Outlet />}</main>
                <InlineBoundary>
                  <Footer lang={lang} />
                </InlineBoundary>
              </ModalWrapper>
            </BannerWrapper>
          </RatesWrapper>
        </HelpDrawerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export { Root };
export default memo(Root);
