/* packages/ui/components/cms/ProductEditorForm.tsx */
"use client";

import {
  Accordion,
  Card,
  CardContent,
  Input,
  Textarea,
} from "../atoms/shadcn";
import { Chip, IconButton, Toast } from "../atoms";
import type { MediaItem } from "@acme/types";
import type { Locale } from "@acme/i18n";
import { useProductEditorFormState } from "../../hooks/useProductEditorFormState";
import type {
  ProductWithVariants,
  ProductSaveResult,
} from "../../hooks/useProductEditorFormState";
import PublishLocationSelector from "./PublishLocationSelector";
import Tabs from "./blocks/Tabs";
import { usePublishLocations } from "@acme/platform-core/hooks/usePublishLocations";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Cross2Icon,
  DragHandleDots2Icon,
  PlusIcon,
} from "@radix-ui/react-icons";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

/* eslint-disable @next/next/no-img-element */

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface BaseProps {
  /** Current product snapshot (all locales) */
  product: ProductWithVariants;
  /** Called with FormData → resolves to updated product or errors */
  onSave(fd: FormData): Promise<ProductSaveResult>;
  /** Locales enabled for the current shop */
  locales: readonly Locale[];
  /** Optional id shared with external toolbars */
  formId?: string;
}

const localeLabel: Partial<Record<Locale, string>> = {
  en: "English",
  de: "Deutsch",
  it: "Italiano",
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function ProductEditorForm({
  product: init,
  onSave,
  locales,
  formId = "product-editor-form",
}: BaseProps) {
  const {
    product,
    errors,
    saving,
    publishTargets,
    setPublishTargets,
    handleChange,
    handleSubmit,
    uploader,
    removeMedia,
    moveMedia,
    addVariantValue,
    removeVariantValue,
  } = useProductEditorFormState(init, locales, onSave);

  const { locations } = usePublishLocations();

  const errorEntries = useMemo(
    () => Object.entries(errors as Record<string, string[]>),
    [errors],
  );
  const hasErrors = errorEntries.length > 0;

  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    { open: false, message: "" },
  );
  const closeToast = useCallback(() => {
    setToast({ open: false, message: "" });
  }, []);
  const prevSavingRef = useRef(false);

  useEffect(() => {
    if (saving && !prevSavingRef.current) {
      setToast({ open: true, message: "Saving product…" });
    } else if (!saving && prevSavingRef.current) {
      setToast({
        open: true,
        message: hasErrors
          ? "We couldn't save your changes. Check the highlighted sections."
          : "Product saved successfully.",
      });
    }
    prevSavingRef.current = saving;
  }, [saving, hasErrors]);

  useEffect(() => {
    if (!toast.open) return undefined;
    const id = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 4000);
    return () => window.clearTimeout(id);
  }, [toast.open]);

  const onFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleSubmit(event);
    },
    [handleSubmit],
  );

  const selectedLocations = useMemo(
    () =>
      publishTargets.map(
        (id) => locations.find((loc) => loc.id === id)?.name ?? id,
      ),
    [publishTargets, locations],
  );

  const variantEntries = useMemo(
    () =>
      Object.entries(product.variants as Record<string, string[]>) as [
        string,
        string[],
      ][],
    [product.variants],
  );

  const accordionItems = locales.map((locale) => ({
    title: (
      <div className="flex items-center gap-2">
        <Chip className="bg-muted px-2 py-1 text-xs uppercase tracking-wide">
          {locale}
        </Chip>
        <span className="text-sm text-muted-foreground">
          {localeLabel[locale] ?? locale.toUpperCase()}
        </span>
      </div>
    ),
    content: (
      <div className="space-y-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Title</span>
          <Input
            name={`title_${locale}`}
            value={product.title[locale]}
            onChange={handleChange}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Description</span>
          <Textarea
            rows={5}
            name={`desc_${locale}`}
            value={product.description[locale]}
            onChange={handleChange}
          />
        </label>
      </div>
    ),
  }));

  return (
    <>
      <Toast open={toast.open} message={toast.message} onClose={closeToast} />
      <form
        id={formId}
        data-testid="product-editor-form"
        onSubmit={onFormSubmit}
        aria-busy={saving}
        className="flex flex-col gap-6"
      >
        <Input type="hidden" name="id" value={product.id} />

        {hasErrors && (
          <div
            className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            data-token="--color-danger"
          >
            <p className="font-medium">We found some issues:</p>
            <ul className="mt-2 space-y-1">
              {errorEntries.map(([field, messages]) => (
                <li key={field}>
                  <span className="font-semibold capitalize">{field}</span>: {messages.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Tabs
          labels={[
            "Pricing",
            "Variants",
            "Publish locations",
            "Media gallery",
            "Localized content",
          ]}
          className="space-y-4"
        >
          <div className="space-y-4">
            <Card>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:max-w-xs">
                  <label className="text-sm font-medium">Price (cents)</label>
                  <Input
                    type="number"
                    name="price"
                    value={product.price}
                    onChange={handleChange}
                    required
                    min={0}
                  />
                </div>
                {product.currency && (
                  <Chip className="bg-muted px-3 py-1 text-xs uppercase tracking-wide">
                    {product.currency}
                  </Chip>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {variantEntries.length === 0 && (
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This product has no variant dimensions configured.
                  </p>
                </CardContent>
              </Card>
            )}
            {variantEntries.map(([attr, values]) => (
              <Card key={attr}>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Chip className="bg-muted px-2 py-1 text-xs uppercase tracking-wide">
                      {attr}
                    </Chip>
                    <IconButton
                      aria-label={`Add option to ${attr}`}
                      onClick={() => addVariantValue(attr)}
                      variant="secondary"
                    >
                      <PlusIcon />
                    </IconButton>
                  </div>
                  <div className="space-y-3">
                    {values.map((value: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          name={`variant_${attr}_${index}`}
                          value={value}
                          onChange={handleChange}
                          className="flex-1"
                        />
                        <IconButton
                          aria-label={`Remove ${attr} option ${index + 1}`}
                          onClick={() => removeVariantValue(attr, index)}
                          variant="ghost"
                        >
                          <Cross2Icon />
                        </IconButton>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-4">
                <PublishLocationSelector
                  selectedIds={publishTargets}
                  onChange={setPublishTargets}
                  showReload
                />
                {publishTargets.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedLocations.map((label) => (
                      <Chip key={label} className="bg-muted px-3 py-1 text-xs">
                        {label}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select one or more destinations to publish this product.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-4">
                {uploader}
                {product.media.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Add imagery or video to showcase this product.
                  </p>
                )}
                {product.media.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {product.media.map((item: MediaItem, index: number) => (
                      <div
                        key={`${item.url}-${index}`}
                        className="group relative overflow-hidden rounded-xl border"
                      >
                        {item.type === "image" ? (
                          <img
                            src={item.url}
                            alt={item.altText || ""}
                            className="h-48 w-full object-cover"
                          />
                        ) : (
                          <video
                            src={item.url}
                            className="h-48 w-full object-cover"
                            controls
                          />
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex items-center gap-1">
                            <IconButton
                              aria-label={`Move media ${index + 1} up`}
                              onClick={() => moveMedia(index, index - 1)}
                              disabled={index === 0}
                              variant="secondary"
                            >
                              <ArrowUpIcon />
                            </IconButton>
                            <IconButton
                              aria-label={`Move media ${index + 1} down`}
                              onClick={() => moveMedia(index, index + 1)}
                              disabled={index === product.media.length - 1}
                              variant="secondary"
                            >
                              <ArrowDownIcon />
                            </IconButton>
                          </div>
                          <IconButton
                            aria-label={`Remove media ${index + 1}`}
                            onClick={() => removeMedia(index)}
                            variant="danger"
                          >
                            <Cross2Icon />
                          </IconButton>
                        </div>
                        <div className="absolute bottom-3 left-3 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs font-medium shadow">
                            <DragHandleDots2Icon aria-hidden />
                            Drag
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent>
                <Accordion items={accordionItems} />
              </CardContent>
            </Card>
          </div>
        </Tabs>

        <button type="submit" className="sr-only">
          Save
        </button>
      </form>
    </>
  );
}
