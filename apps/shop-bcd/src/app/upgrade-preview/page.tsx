"use client";

import React, { useEffect, useState } from "react";

interface UpgradeComponent {
  file: string;
  componentName: string;
  pages?: string[];
}

interface PreviewPage {
  id: string;
  token: string;
}

const exampleProps: Record<string, any> = {
  Breadcrumbs: {
    items: [
      { label: "Home", href: "/" },
      { label: "Shop", href: "/shop" },
    ],
  },
};

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
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

function ComponentPreview({ component }: { component: UpgradeComponent }) {
  const [NewComp, setNewComp] = useState<React.ComponentType | null>(null);
  const [OldComp, setOldComp] = useState<React.ComponentType | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    const basePath = `@ui/components/${component.file.replace(/\.[jt]sx?$/, "")}`;
    const load = async (p: string) => {
      if (
        typeof globalThis !== "undefined" &&
        (globalThis as any).__UPGRADE_MOCKS__?.[p]
      ) {
        return (globalThis as any).__UPGRADE_MOCKS__[p];
      }
      return import(p);
    };

    load(basePath)
      .then((m) => setNewComp(() => (m[component.componentName] ?? m.default)))
      .catch((err) =>
        console.error("Failed to load component", component.componentName, err)
      );
    load(`${basePath}.bak`)
      .then((m) => setOldComp(() => (m[component.componentName] ?? m.default)))
      .catch(() => {});
  }, [component]);

  const props = exampleProps[component.componentName] ?? {};

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
            <div>{NewComp ? <NewComp {...props} /> : null}</div>
            <div>{OldComp ? <OldComp {...props} /> : null}</div>
          </div>
        ) : NewComp ? (
          <NewComp {...props} />
        ) : null}
      </PreviewErrorBoundary>
    </div>
  );
}

export default function UpgradePreviewPage() {
  const [changes, setChanges] = useState<UpgradeComponent[]>([]);
  const [pages, setPages] = useState<PreviewPage[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/upgrade-changes");
        const data = (await res.json()) as {
          components: UpgradeComponent[];
        };
        setChanges(data.components);
        const uniquePageIds = Array.from(
          new Set(
            data.components.flatMap((c) => c.pages ?? [])
          )
        );
        const tokenEntries = await Promise.all(
          uniquePageIds.map(async (id) => {
            const tokenRes = await fetch(`/api/preview-token?pageId=${id}`);
            const json = (await tokenRes.json()) as { token: string };
            return { id, token: json.token };
          })
        );
        setPages(tokenEntries);
      } catch (err) {
        console.error("Failed to load upgrade changes", err);
      }
    }
    void load();
  }, []);

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/publish", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || "Publish failed");
      }
    } catch (err) {
      console.error("Publish failed", err);
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-8">
      <ul className="space-y-4">
        {changes.map((c) => (
          <li key={c.file}>
            <ComponentPreview component={c} />
          </li>
        ))}
      </ul>
      {pages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Affected pages</h2>
          <ul className="list-disc pl-4">
            {pages.map((p) => (
              <li key={p.id}>
                <a
                  href={`/preview/${p.id}?upgrade=${p.token}`}
                  className="text-blue-600 underline"
                >
                  {p.id}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={handlePublish}
        className="rounded border px-4 py-2"
        disabled={publishing}
      >
        {publishing ? "Publishing..." : "Approve & publish"}
      </button>
      {error && <p role="alert" className="text-red-600">{error}</p>}
    </div>
  );
}

