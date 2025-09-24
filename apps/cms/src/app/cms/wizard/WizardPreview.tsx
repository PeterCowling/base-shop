// apps/cms/src/app/cms/wizard/WizardPreview.tsx

"use client";

import { blockRegistry } from "@ui/components/cms/blocks";
import { Footer, Header, SideNav } from "@ui/components/organisms";
import { AppShell } from "@ui/components/templates";
import TranslationsProvider from "@/i18n/Translations";
import enMessages from "@i18n/en.json";
import type { PageComponent } from "@acme/types";
import DOMPurify from "dompurify";
import React, { useEffect, useState, useMemo, forwardRef } from "react";
import { STORAGE_KEY } from "../configurator/hooks/useConfiguratorPersistence";
import { devicePresets, type DevicePreset } from "@ui/utils/devicePresets";
import usePreviewTokens from "./usePreviewTokens";
import { THEME_TOKEN_HOVER_EVENT, type TokenHoverDetail } from "../../shop/[shop]/themes/events";

interface Props {
  style: React.CSSProperties;
  device?: DevicePreset;
}

/**
 * Renders a live preview of the page the wizard is currently building.
 * The preview reads wizard state from localStorage (keyed by `STORAGE_KEY`)
 * so it always shows the latest edits without needing a full refresh.
 */
const WizardPreview = forwardRef<HTMLDivElement, Props>(function WizardPreview(
  { style, device: deviceProp },
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

  /** Renders a single block component */
  function Block({ component }: { component: PageComponent }) {
    /* Plain rich-text blocks are handled separately */
    if (component.type === "Text") {
      const text = (component as Record<string, unknown>).text;
      const value =
        typeof text === "string"
          ? text
          : ((text as Record<string, string>).en ?? "");
      const sanitized = DOMPurify.sanitize(value);
      return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
    }

    /* Look up the React component in the block registry.
       We cast through `unknown` first to silence TS2352, because
       individual block components have stricter prop requirements
       than the generic Record<string, unknown> we use here. */
    const entry = (
      blockRegistry as unknown as Record<
        string,
        { component: React.ComponentType<Record<string, unknown>> }
      >
    )[component.type];

    const Comp = entry?.component;

    if (!Comp) return null;

    /* Remove metadata fields before spreading props */
    const {
      id: _id,
      type: _type,
      ...props
    } = component as Record<string, unknown>;
    void _id;
    void _type;

    return <Comp {...props} locale="en" />;
  }

  return (
    <div
      ref={ref}
      style={containerStyle}
      className="mx-auto rounded border"
      data-token="--color-bg"
    >
      <TranslationsProvider messages={enMessages}>
        <AppShell
          header={<Header locale="en" shopName="" />}
          sideNav={<SideNav />}
          footer={<Footer shopName="" />}
        >
          {components.map((c) => (
            <Block key={c.id} component={c} />
          ))}
        </AppShell>
      </TranslationsProvider>
    </div>
  );
});

export default WizardPreview;
