"use client";

import React, { useEffect, useState } from "react";
import type { UpgradeComponent } from "@acme/types/upgrade";

class PreviewErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Component preview failed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded border p-4 text-red-500">
          Failed to render preview
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
  const [NewComp, setNewComp] = useState<React.ComponentType | null>(null);
  const [OldComp, setOldComp] = useState<React.ComponentType | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    const basePath = `@ui/components/${component.file.replace(/\.[jt]sx?$/, "")}`;
    const load = async (p: string) => {
      if (
        typeof globalThis !== "undefined" &&
        globalThis.__UPGRADE_MOCKS__?.[p]
      ) {
        return globalThis.__UPGRADE_MOCKS__[p];
      }
      const m = await import(p);
      return (m as Record<string, React.ComponentType>)[
        component.componentName
      ] ?? m.default;
    };

    load(basePath)
      .then((comp) => setNewComp(() => comp))
      .catch((err) =>
        console.error("Failed to load component", component.componentName, err)
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
            className="rounded border px-2 py-1"
            onClick={() => setShowCompare((s) => !s)}
          >
            {showCompare ? "Hide comparison" : "Compare"}
          </button>
        )}
      </div>
      <PreviewErrorBoundary>
        {showCompare && OldComp ? (
          <div className="grid grid-cols-2 gap-4">
            <div>{NewComp ? <NewComp {...componentProps} /> : null}</div>
            <div>{OldComp ? <OldComp {...componentProps} /> : null}</div>
          </div>
        ) : NewComp ? (
          <NewComp {...componentProps} />
        ) : null}
      </PreviewErrorBoundary>
    </div>
  );
}

