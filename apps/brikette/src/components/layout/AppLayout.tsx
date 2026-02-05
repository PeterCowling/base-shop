import React, { memo, useEffect } from "react";

import { NotificationBanner } from "@acme/ui/molecules";
import { Header } from "@acme/ui/organisms/Header";

import { InlineBoundary } from "@/components/common/InlineBoundary";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Footer } from "@/components/footer/Footer";
import { HelpDrawerProvider } from "@/context/HelpDrawerContext";
import { ModalProvider } from "@/context/ModalContext";
import { BannerProvider } from "@/context/NotificationBannerContext";
import { RatesProvider } from "@/context/RatesContext";
import { useI18nPreloading } from "@/hooks/useI18nPreloading";
import { useProtectBrandName } from "@/hooks/useProtectBrandName";
import { useWebVitals } from "@/hooks/useWebVitals";
import { type AppLanguage } from "@/i18n.config";
import { CORE_LAYOUT_I18N_NAMESPACES } from "@/i18n.namespaces";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { getPathname, isTestEnvironment } from "@/utils/env-helpers";
import prefetchInteractiveBundles, {
  shouldPrefetchInteractiveBundlesOnIdle,
} from "@/utils/prefetchInteractive";

type AppLayoutProps = {
  lang: AppLanguage;
  children: React.ReactNode;
};

function AppLayout({ lang, children }: AppLayoutProps): React.JSX.Element {
  useWebVitals();
  useProtectBrandName();

  useI18nPreloading({ lang, namespaces: CORE_LAYOUT_I18N_NAMESPACES });

  useEffect(() => {
    const pathname = getPathname();
    if (shouldPrefetchInteractiveBundlesOnIdle(pathname)) {
      void prefetchInteractiveBundles();
    }
  }, []);

  const isTest = isTestEnvironment();
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
