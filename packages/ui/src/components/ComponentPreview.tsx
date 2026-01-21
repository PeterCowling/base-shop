/* i18n-exempt file */
"use client";

import React, { useEffect, useState } from "react";

import type { UpgradeComponent } from "@acme/types";

// i18n-exempt — developer tooling copy (not user-facing)
/* i18n-exempt */
// Local noop translator to satisfy linting without wiring i18n
const t = (s: string) => s;
const TXT_FAILED = t("Failed to render preview");

declare global {
  var __UPGRADE_MOCKS__: Record<string, React.ComponentType> | undefined;
}

class PreviewErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(t("Component preview failed"), error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded border p-4 text-danger">
          {TXT_FAILED}
        </div>
      );
    }
    return this.props.children;
  }
}

export interface ComponentPreviewProps<
  Props extends Record<string, unknown> = Record<string, unknown>,
> {
  component: UpgradeComponent;
  componentProps?: Props;
}

export default function ComponentPreview<
  Props extends Record<string, unknown> = Record<string, unknown>,
>({ component, componentProps = {} as Props }: ComponentPreviewProps<Props>) {
  // i18n-exempt — developer tooling copy (not user-facing)
  /* i18n-exempt */
  const TXT_HIDE_COMPARISON = t("Hide comparison");
  /* i18n-exempt */
  const TXT_COMPARE = t("Compare");
  /* i18n-exempt */
  const TXT_SIDE_BY_SIDE = t("Side by side");
  /* i18n-exempt */
  const TXT_TOGGLE = t("Toggle");
  /* i18n-exempt */
  const TXT_SHOW_OLD = t("Show old");
  /* i18n-exempt */
  const TXT_SHOW_NEW = t("Show new");
  const [NewComp, setNewComp] = useState<React.ComponentType | null>(null);
  const [OldComp, setOldComp] = useState<React.ComponentType | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [compareMode, setCompareMode] = useState<"side" | "toggle">("side");
  const [showNew, setShowNew] = useState(true);

  useEffect(() => {
    const basePath = `@acme/ui/components/${component.file.replace(/\.[jt]sx?$/, "")}`;
    const load = async (p: string) => {
      if (
        typeof globalThis !== "undefined" &&
        globalThis.__UPGRADE_MOCKS__?.[p]
      ) {
        return globalThis.__UPGRADE_MOCKS__[p];
      }
      const m = await import(
        /* webpackIgnore: true */
        /* @vite-ignore */
        p
      );
      return (m as Record<string, React.ComponentType>)[
        component.componentName
      ] ?? m.default;
    };

    load(basePath)
      .then((comp) => setNewComp(() => comp))
      .catch((err) =>
        console.error(t("Failed to load component"), component.componentName, err)
      );
    load(`${basePath}.bak`)
      .then((comp) => setOldComp(() => comp))
      .catch(() => {});
  }, [component]);

  return (
    <div className="space-y-2 rounded border p-4">
      <div className="flex items-center justify-between">
        <h3>{component.componentName}</h3>
        {OldComp && (
          <button
            type="button"
            className="rounded border px-2 py-1 min-h-11 min-w-11"
            onClick={() => setShowCompare((s) => !s)}
          >
            {showCompare ? TXT_HIDE_COMPARISON : TXT_COMPARE}
          </button>
        )}
      </div>
      <PreviewErrorBoundary>
        {showCompare && OldComp ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCompareMode("side")}
                className={`rounded border px-2 py-1 min-h-11 min-w-11 ${
                  compareMode === "side" ? "bg-muted" : ""
                }`}
              >
                {TXT_SIDE_BY_SIDE}
              </button>
              <button
                type="button"
                onClick={() => setCompareMode("toggle")}
                className={`rounded border px-2 py-1 min-h-11 min-w-11 ${
                  compareMode === "toggle" ? "bg-muted" : ""
                }`}
              >
                {TXT_TOGGLE}
              </button>
            </div>
            {compareMode === "side" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>{NewComp ? <NewComp {...componentProps} /> : null}</div>
                <div>{OldComp ? <OldComp {...componentProps} /> : null}</div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  className="rounded border px-2 py-1 min-h-11 min-w-11"
                  onClick={() => setShowNew((s) => !s)}
                >
                  {showNew ? TXT_SHOW_OLD : TXT_SHOW_NEW}
                </button>
                <div>
                  {showNew
                    ? NewComp && <NewComp {...componentProps} />
                    : OldComp && <OldComp {...componentProps} />}
                </div>
              </div>
            )}
          </div>
        ) : NewComp ? (
          <NewComp {...componentProps} />
        ) : null}
      </PreviewErrorBoundary>
    </div>
  );
}
