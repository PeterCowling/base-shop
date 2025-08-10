// apps/cms/src/app/cms/wizard/WizardPreview.tsx

"use client";

import { Button } from "@ui";
import { blockRegistry } from "@ui";
import { Footer, Header, SideNav } from "@ui";
import { AppShell } from "@ui";
import TranslationsProvider from "@/i18n/Translations";
import enMessages from "@i18n/en.json";
import type { PageComponent } from "@types";
import React, { useEffect, useState } from "react";
import { STORAGE_KEY } from "./storageUtils";

interface Props {
  style: React.CSSProperties;
}

/**
 * Renders a live preview of the page the wizard is currently building.
 * The preview reads wizard state from localStorage (keyed by `STORAGE_KEY`)
 * so it always shows the latest edits without needing a full refresh.
 */
export default function WizardPreview({ style }: Props): React.JSX.Element {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const [components, setComponents] = useState<PageComponent[]>([]);

  /* ------------------------------------------------------------------ */
  /*             Sync wizard state from localStorage                    */
  /* ------------------------------------------------------------------ */
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
    return () => window.removeEventListener("storage", load);
  }, []);

  /* ------------------------------------------------------------------ */
  /*                         Helpers                                    */
  /* ------------------------------------------------------------------ */

  const widthMap: Record<"desktop" | "tablet" | "mobile", string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const containerStyle = { ...style, width: widthMap[viewport] };

  /** Renders a single block component */
  function Block({ component }: { component: PageComponent }) {
    /* Plain rich-text blocks are handled separately */
    if (component.type === "Text") {
      const text = (component as Record<string, unknown>).text;
      const value =
        typeof text === "string"
          ? text
          : ((text as Record<string, string>).en ?? "");
      return <div dangerouslySetInnerHTML={{ __html: value }} />;
    }

    /* Look up the React component in the block registry.
       We cast through `unknown` first to silence TS2352, because
       individual block components have stricter prop requirements
       than the generic Record<string, unknown> we use here. */
    const Comp = (
      blockRegistry as unknown as Record<
        string,
        React.ComponentType<Record<string, unknown>>
      >
    )[component.type];

    if (!Comp) return null;

    /* Remove metadata fields before spreading props */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      id: _id,
      type: _type,
      ...props
    } = component as Record<string, unknown>;

    return <Comp {...props} locale="en" />;
  }

  /* ------------------------------------------------------------------ */
  /*                             Render                                 */
  /* ------------------------------------------------------------------ */
  return (
    <div className="space-y-2">
      {/* viewport switcher */}
      <div className="flex justify-end gap-2">
        <Button
          variant={viewport === "desktop" ? "default" : "outline"}
          onClick={() => setViewport("desktop")}
        >
          Desktop
        </Button>
        <Button
          variant={viewport === "tablet" ? "default" : "outline"}
          onClick={() => setViewport("tablet")}
        >
          Tablet
        </Button>
        <Button
          variant={viewport === "mobile" ? "default" : "outline"}
          onClick={() => setViewport("mobile")}
        >
          Mobile
        </Button>
      </div>

      {/* live preview */}
      <div style={containerStyle} className="mx-auto rounded border">
        <TranslationsProvider messages={enMessages}>
          <AppShell
            header={<Header locale="en" />}
            sideNav={<SideNav />}
            footer={<Footer />}
          >
            {components.map((c) => (
              <Block key={c.id} component={c} />
            ))}
          </AppShell>
        </TranslationsProvider>
      </div>
    </div>
  );
}
