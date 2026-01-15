"use client";

import type {
  ProductConfigSchema,
  SelectionState,
  ValidateResponse,
} from "@acme/product-configurator";
import { useEffect, useRef, useState } from "react";
import { ViewerCanvas } from "../viewer/ViewerCanvas";
import { useHotspotConfig } from "../viewer/hotspots/useHotspotConfig";
import { useModeStore } from "../viewer/state/modeStore";
import { ConfiguratorPanel } from "../ui/ConfiguratorPanel";
import { TopBar } from "../ui/TopBar";

type ConfiguratorPageProps = {
  schema: ProductConfigSchema | null;
  apiOrigin: string;
  error?: string | null;
};

function selectionsEqual(a: SelectionState, b: SelectionState) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export function ConfiguratorPage({ schema, apiOrigin, error }: ConfiguratorPageProps) {
  const closePanel = useModeStore((state) => state.closePanel);
  const clearActiveRegion = useModeStore((state) => state.clearActiveRegion);

  const [selections, setSelections] = useState<SelectionState>({});
  const handleColorOverrideRef = useRef(false);
  const [validation, setValidation] = useState<ValidateResponse | null>(null);
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const defaultSelectionsRef = useRef<SelectionState>({});

  useEffect(() => {
    if (!schema) {
      setSelections({});
      setValidation(null);
      defaultSelectionsRef.current = {};
      return;
    }
    const defaults: SelectionState = {};
    for (const property of schema.properties) {
      defaults[property.key] = property.defaultValue;
    }
    defaultSelectionsRef.current = defaults;
    setSelections(defaults);
    handleColorOverrideRef.current = false;
  }, [schema]);

  useEffect(() => {
    let cancelled = false;
    async function loadConfigState() {
      if (!schema) return;
      if (schema.properties.length > 0 && Object.keys(selections).length === 0) {
        return;
      }
      try {
        setValidationStatus("loading");
        const validateRes = await fetch(`${apiOrigin}/config/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: schema.productId,
            selections,
          }),
        });
        if (!validateRes.ok) throw new Error("Validation request failed");
        const validationData = (await validateRes.json()) as ValidateResponse;
        if (cancelled) return;
        setValidation(validationData);

        const allowedDomains = validationData.allowedDomainsDelta ?? {};
        const nextSelections: SelectionState = {
          ...validationData.normalizedSelections,
        };

        for (const [key, allowed] of Object.entries(allowedDomains)) {
          if (!Array.isArray(allowed) || allowed.length === 0) continue;
          const [firstAllowed] = allowed;
          if (!firstAllowed) continue;
          const current = nextSelections[key];
          if (!current || !allowed.includes(current)) {
            nextSelections[key] = firstAllowed;
          }
        }

        if (!selectionsEqual(selections, nextSelections)) {
          setSelections(nextSelections);
          setValidationStatus("idle");
          return;
        }

        setValidationStatus("idle");
      } catch {
        if (cancelled) return;
        setValidationStatus("error");
      }
    }
    void loadConfigState();
    return () => {
      cancelled = true;
    };
  }, [apiOrigin, schema, selections]);

  const resolvedProductId = schema?.productId ?? "bag-001";
  const productName = schema?.productId
    ? schema.productId
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "Antares";
  const { config: hotspotConfig, saveOffsets } = useHotspotConfig(
    resolvedProductId,
  );
  const frameOffsetScale = { x: 0, y: 0 };
  const frameTightness = 0.94;
  const frameFit = "height";

  const handleSelectionChange = (key: string, value: string) => {
    if (key === "handleColor") {
      handleColorOverrideRef.current = true;
    }
    setSelections((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "bodyColor" && !handleColorOverrideRef.current
        ? { handleColor: value }
        : {}),
    }));
  };

  const handleDone = () => {
    closePanel();
    clearActiveRegion();
  };

  const handleReset = () => {
    setSelections(defaultSelectionsRef.current);
    handleColorOverrideRef.current = false;
  };

  return (
    <div className="handbag-shell flex min-h-dvh flex-col">
      <TopBar productName={productName} />

      <div className="relative flex flex-1 min-h-0 flex-col">
        <ViewerCanvas
          productId={resolvedProductId}
          selections={selections}
          hotspotConfig={hotspotConfig}
          onPersistHotspotOffsets={saveOffsets}
          hideTierControls
          frameMode="full"
          frameOffsetScale={frameOffsetScale}
          frameTightness={frameTightness}
          frameFit={frameFit}
          {...(schema ? { schema } : {})}
        />

        {error ? (
          <div className="absolute left-6 top-6 max-w-sm rounded-2xl border border-danger/30 bg-danger-soft p-4 text-xs text-danger-foreground">
            {error}
          </div>
        ) : null}

        <ConfiguratorPanel
          selections={selections}
          onSelect={handleSelectionChange}
          validation={validation}
          validationStatus={validationStatus}
          hotspotConfig={hotspotConfig}
          {...(schema ? { schema } : {})}
        />

        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-6 text-sm text-primary">
          <button
            type="button"
            className="pointer-events-auto transition hover:text-primary/80"
            onClick={handleDone}
          >
            I&apos;m done
          </button>
          <span className="h-6 w-px bg-border-1" aria-hidden="true" />
          <button
            type="button"
            className="pointer-events-auto transition hover:text-primary/80"
            onClick={() => {}}
          >
            Save/Share
          </button>
          <span className="h-6 w-px bg-border-1" aria-hidden="true" />
          <button
            type="button"
            className="pointer-events-auto transition hover:text-primary/80"
            onClick={handleReset}
          >
            Blank Bag
          </button>
        </div>
      </div>
    </div>
  );
}
