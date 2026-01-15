import ErrorBoundary from "@/components/ErrorBoundary";
import { Footer } from "@/components/footer/Footer";
import { NotificationBanner } from "@acme/ui/molecules/NotificationBanner";
import { Header } from "@acme/ui/organisms/Header";
import { HelpDrawerProvider } from "@/context/HelpDrawerContext";
import { ModalProvider } from "@/context/ModalContext";
import { BannerProvider } from "@/context/NotificationBannerContext";
import { RatesProvider } from "@/context/RatesContext";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useProtectBrandName } from "@/hooks/useProtectBrandName";
import { useWebVitals } from "@/hooks/useWebVitals";
import prefetchInteractiveBundles from "@/utils/prefetchInteractive";
import { preloadI18nNamespaces } from "@/utils/loadI18nNs";
import React, { memo, useEffect, useLayoutEffect } from "react";
import i18n from "@/i18n";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { APP_I18N_NAMESPACES } from "@/i18n.namespaces";
import { InlineBoundary } from "@/root/boundaries";
import { isTestEnvironment } from "@/root/environment";
import { IS_DEV } from "@/config/env";

type AppLayoutProps = {
  lang: AppLanguage;
  children: React.ReactNode;
};

function AppLayout({ lang, children }: AppLayoutProps): React.JSX.Element {
  useWebVitals();
  useProtectBrandName();

  useLayoutEffect(() => {
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang).catch((error) => {
        if (IS_DEV) {
          console.error(error);
        }
      });
    }
  }, [lang]);

  useEffect(() => {
    const namespaces = APP_I18N_NAMESPACES;

    const loadFor = async (next: string | undefined) => {
      const normalized = (() => {
        const raw = next?.toLowerCase();
        if (!raw) return undefined;
        const base = raw.split("-")[0];
        if (!base) return undefined;
        return (i18nConfig.supportedLngs as readonly string[]).includes(base)
          ? (base as AppLanguage)
          : undefined;
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
  const RatesWrapper = isTest
    ? ({ children: wrapperChildren }: { children: React.ReactNode }) => <>{wrapperChildren}</>
    : RatesProvider;
  const BannerWrapper = isTest
    ? ({ children: wrapperChildren }: { children: React.ReactNode }) => <>{wrapperChildren}</>
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
                <main className="pt-16 lg:pt-0">{children}</main>
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

export default memo(AppLayout);
