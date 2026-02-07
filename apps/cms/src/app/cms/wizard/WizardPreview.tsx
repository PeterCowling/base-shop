// apps/cms/src/app/cms/wizard/WizardPreview.tsx

"use client";

import React, { forwardRef,useEffect, useMemo, useState } from "react";

import enMessages from "@acme/i18n/en.json";
import type { PageComponent } from "@acme/types";
import DynamicRenderer from "@acme/ui/components/DynamicRenderer";
import { Footer, Header, SideNav } from "@acme/ui/components/organisms";
import { AppShell } from "@acme/ui/components/templates";
import { type DevicePreset,devicePresets } from "@acme/ui/utils/devicePresets";

import TranslationsProvider from "@/i18n/Translations";

import { STORAGE_KEY } from "../configurator/hooks/useConfiguratorPersistence";
import { THEME_TOKEN_HOVER_EVENT, type TokenHoverDetail } from "../shop/[shop]/themes/events";

import usePreviewTokens from "./usePreviewTokens";

interface Props {
  style: React.CSSProperties;
  device?: DevicePreset;
  hideHeader?: boolean;
}

/**
 * Renders a live preview of the page the wizard is currently building.
 * The preview reads wizard state from localStorage (keyed by `STORAGE_KEY`)
 * so it always shows the latest edits without needing a full refresh.
 */
const WizardPreview = forwardRef<HTMLDivElement, Props>(function WizardPreview(
  { style, device: deviceProp, hideHeader = false },
  ref,
) {
  const [components, setComponents] = useState<PageComponent[]>([]);
  const tokens = usePreviewTokens();
  const device = deviceProp ?? devicePresets[0];

  useEffect(() => {
    const load = () => {
      try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) return;
        const data = JSON.parse(json);
        if (Array.isArray(data.components)) {
          setComponents(data.components as PageComponent[]);
        }
      } catch {
        /* ignore JSON errors */
      }
    };

    load();
    window.addEventListener("storage", load);
    window.addEventListener("configurator:update", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("configurator:update", load);
    };
  }, []);

  const containerStyle = useMemo(
    () => ({
      ...tokens,
      ...style,
      width: `${device.width}px`,
      height: `${device.height}px`,
    }),
    [tokens, style, device],
  );

  // Highlight impacted areas: outline elements matching data-token when hovering a token in editor
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<TokenHoverDetail>).detail;
      const token = detail?.token;
      const previewEl = (ref as React.MutableRefObject<HTMLDivElement | null>).current;
      if (!previewEl) return;
      const all = Array.from(previewEl.querySelectorAll<HTMLElement>("[data-token]"));
      all.forEach((el) => {
        const matches = token && el.getAttribute("data-token") === token;
        el.style.outline = matches ? "2px solid hsl(var(--color-primary))" : "";
      });
    };
    window.addEventListener(THEME_TOKEN_HOVER_EVENT, handler as EventListener);
    return () => window.removeEventListener(THEME_TOKEN_HOVER_EVENT, handler as EventListener);
  }, [ref]);

  return (
    <div
      ref={ref}
      style={containerStyle}
      className="mx-auto rounded border"
      data-token="--color-bg"
    >
      <TranslationsProvider messages={enMessages}>
        <AppShell
          header={hideHeader ? undefined : <Header locale="en" shopName="" />}
          sideNav={<SideNav />}
          footer={<Footer shopName="" />}
        >
          <DynamicRenderer components={components} locale="en" />
        </AppShell>
      </TranslationsProvider>
    </div>
  );
});

export default WizardPreview;
