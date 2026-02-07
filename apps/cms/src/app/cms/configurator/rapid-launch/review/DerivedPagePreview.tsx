"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { Grid } from "@acme/design-system/primitives";
import { cn } from "@acme/design-system/utils/style";
import type { DerivedPage } from "@acme/platform-core/launch";
import type { PageComponent, SKU } from "@acme/types";

type UpdateComponent = (componentId: string, updater: (component: PageComponent) => PageComponent) => void;

interface DerivedPagePreviewProps {
  page: DerivedPage;
  locale: string;
  onUpdateComponent: UpdateComponent;
}

function getLocalizedValue(value: unknown, locale: string): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, string>;
  return record[locale] ?? record.en ?? Object.values(record)[0] ?? "";
}

function setLocalizedValue(value: unknown, locale: string, next: string): string | Record<string, string> {
  if (typeof value === "string" || !value || typeof value !== "object") return next;
  return { ...(value as Record<string, string>), [locale]: next };
}

function EditableText({
  value,
  onCommit,
  className,
}: {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      className={cn(
        "min-h-[1.5rem] rounded border border-transparent px-2 py-1 text-sm leading-relaxed outline-none focus:border-primary/60 focus:bg-background",
        className,
      )}
      onInput={(event) => setDraft(event.currentTarget.textContent ?? "")}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
    >
      {draft}
    </div>
  );
}

function BlockShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-background px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

export default function DerivedPagePreview({
  page,
  locale,
  onUpdateComponent,
}: DerivedPagePreviewProps): React.JSX.Element {
  const renderComponent = (component: PageComponent): React.ReactNode => {
    const children = (component as { children?: PageComponent[] }).children;
    const hasChildren = Array.isArray(children) && children.length > 0;

    switch (component.type) {
      case "Text": {
        const textValue = getLocalizedValue(
          (component as { text?: string | Record<string, string> }).text,
          locale,
        );
        return (
          <BlockShell title="Text">
            <EditableText
              value={textValue}
              onCommit={(next) =>
                onUpdateComponent(component.id, (current) => ({
                  ...current,
                  text: setLocalizedValue(
                    (current as { text?: string | Record<string, string> }).text,
                    locale,
                    next,
                  ),
                }))
              }
            />
          </BlockShell>
        );
      }
      case "HeroBanner": {
        const slides = (component as { slides?: Array<Record<string, unknown>> }).slides ?? [];
        return (
          <BlockShell title="Hero">
            <div className="space-y-3">
              {slides.map((slide, index) => {
                const headline = typeof slide.headlineKey === "string" ? slide.headlineKey : "";
                const subhead = typeof slide.subheadKey === "string" ? slide.subheadKey : "";
                const cta = typeof slide.ctaKey === "string" ? slide.ctaKey : "";
                const src = typeof slide.src === "string" ? slide.src : "";
                return (
                  <div key={`${component.id}-slide-${index}`} className="space-y-2 rounded-lg border p-3">
                    {src ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-md">
                        <Image
                          src={src}
                          alt={typeof slide.alt === "string" ? slide.alt : ""}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-md border border-dashed bg-muted/50" />
                    )}
                    <EditableText
                      value={headline}
                      className="text-base font-semibold"
                      onCommit={(next) =>
                        onUpdateComponent(component.id, (current) => {
                          const currentSlides = (current as { slides?: Array<Record<string, unknown>> }).slides ?? [];
                          const nextSlides = currentSlides.map((entry, idx) =>
                            idx === index ? { ...entry, headlineKey: next } : entry,
                          );
                          return { ...current, slides: nextSlides };
                        })
                      }
                    />
                    {subhead ? (
                      <EditableText
                        value={subhead}
                        className="text-sm text-muted-foreground"
                        onCommit={(next) =>
                          onUpdateComponent(component.id, (current) => {
                            const currentSlides = (current as { slides?: Array<Record<string, unknown>> }).slides ?? [];
                            const nextSlides = currentSlides.map((entry, idx) =>
                              idx === index ? { ...entry, subheadKey: next } : entry,
                            );
                            return { ...current, slides: nextSlides };
                          })
                        }
                      />
                    ) : null}
                    {cta ? (
                      <EditableText
                        value={cta}
                        className="text-xs font-semibold uppercase tracking-wide text-primary"
                        onCommit={(next) =>
                          onUpdateComponent(component.id, (current) => {
                            const currentSlides = (current as { slides?: Array<Record<string, unknown>> }).slides ?? [];
                            const nextSlides = currentSlides.map((entry, idx) =>
                              idx === index ? { ...entry, ctaKey: next } : entry,
                            );
                            return { ...current, slides: nextSlides };
                          })
                        }
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </BlockShell>
        );
      }
      case "Image": {
        const src = (component as { src?: string }).src ?? "";
        return (
          <BlockShell title="Image">
            {src ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-md">
                <Image src={src} alt="" fill sizes="100vw" className="object-cover" />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-md border border-dashed bg-muted/50" />
            )}
          </BlockShell>
        );
      }
      case "ImageSlider": {
        const slides = (component as { slides?: Array<Record<string, unknown>> }).slides ?? [];
        return (
          <BlockShell title="Image slider">
            <Grid cols={1} gap={2} className="md:grid-cols-2">
              {slides.map((slide, index) => {
                const src = typeof slide.src === "string" ? slide.src : "";
                return src ? (
                  <div
                    key={`${component.id}-img-${index}`}
                    className="relative aspect-video w-full overflow-hidden rounded-md"
                  >
                    <Image
                      src={src}
                      alt={typeof slide.alt === "string" ? slide.alt : ""}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    key={`${component.id}-img-${index}`}
                    className="aspect-video w-full rounded-md border border-dashed bg-muted/50"
                  />
                );
              })}
            </Grid>
          </BlockShell>
        );
      }
      case "ProductGrid": {
        const skus = (component as { skus?: SKU[] }).skus ?? [];
        const preview = skus.slice(0, 5);
        return (
          <BlockShell title="Product grid">
            <div className="text-sm text-muted-foreground">
              {skus.length} products linked
            </div>
            {preview.length > 0 && (
              <ul className="space-y-1 text-sm">
                {preview.map((sku) => (
                  <li key={sku.id} className="flex items-center justify-between gap-2">
                    <span>{sku.title}</span>
                    <span className="text-xs text-muted-foreground">#{sku.id}</span>
                  </li>
                ))}
              </ul>
            )}
          </BlockShell>
        );
      }
      case "FAQBlock": {
        const items = (component as { items?: Array<{ question: string; answer: string }> }).items ?? [];
        return (
          <BlockShell title="FAQ">
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={`${component.id}-faq-${index}`} className="rounded-md border border-border/60 p-2">
                  <EditableText
                    value={item.question}
                    className="text-sm font-semibold"
                    onCommit={(next) =>
                      onUpdateComponent(component.id, (current) => {
                        const currentItems =
                          (current as { items?: Array<{ question: string; answer: string }> }).items ?? [];
                        const nextItems = currentItems.map((entry, idx) =>
                          idx === index ? { ...entry, question: next } : entry,
                        );
                        return { ...current, items: nextItems };
                      })
                    }
                  />
                  <EditableText
                    value={item.answer}
                    className="text-sm text-muted-foreground"
                    onCommit={(next) =>
                      onUpdateComponent(component.id, (current) => {
                        const currentItems =
                          (current as { items?: Array<{ question: string; answer: string }> }).items ?? [];
                        const nextItems = currentItems.map((entry, idx) =>
                          idx === index ? { ...entry, answer: next } : entry,
                        );
                        return { ...current, items: nextItems };
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </BlockShell>
        );
      }
      case "ValueProps": {
        const items = (component as { items?: Array<{ title?: string; desc?: string }> }).items ?? [];
        return (
          <BlockShell title="Value props">
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={`${component.id}-vp-${index}`} className="rounded-md border border-border/60 p-2">
                  <EditableText
                    value={getLocalizedValue(item.title, locale)}
                    className="text-sm font-semibold"
                    onCommit={(next) =>
                      onUpdateComponent(component.id, (current) => {
                        const currentItems =
                          (current as { items?: Array<{ title?: string; desc?: string }> }).items ?? [];
                        const nextItems = currentItems.map((entry, idx) =>
                          idx === index
                            ? {
                                ...entry,
                                title: setLocalizedValue(entry.title, locale, next),
                              }
                            : entry,
                        );
                        return { ...current, items: nextItems };
                      })
                    }
                  />
                  <EditableText
                    value={getLocalizedValue(item.desc, locale)}
                    className="text-sm text-muted-foreground"
                    onCommit={(next) =>
                      onUpdateComponent(component.id, (current) => {
                        const currentItems =
                          (current as { items?: Array<{ title?: string; desc?: string }> }).items ?? [];
                        const nextItems = currentItems.map((entry, idx) =>
                          idx === index
                            ? {
                                ...entry,
                                desc: setLocalizedValue(entry.desc, locale, next),
                              }
                            : entry,
                        );
                        return { ...current, items: nextItems };
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </BlockShell>
        );
      }
      case "PoliciesAccordion": {
        const accordion = component as { shipping?: string; returns?: string; warranty?: string };
        const items = [
          { key: "shipping", label: "Shipping policy", value: accordion.shipping ?? "" },
          { key: "returns", label: "Returns policy", value: accordion.returns ?? "" },
          { key: "warranty", label: "Warranty", value: accordion.warranty ?? "" },
        ];
        return (
          <BlockShell title="Policies">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={`${component.id}-${item.key}`} className="rounded-md border border-border/60 p-2">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {item.label}
                  </div>
                  <EditableText
                    value={item.value}
                    className="text-sm text-muted-foreground"
                    onCommit={(next) =>
                      onUpdateComponent(component.id, (current) => ({
                        ...current,
                        [item.key]: next,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </BlockShell>
        );
      }
      case "Callout": {
        const callout = component as {
          title?: string | Record<string, string>;
          body?: string | Record<string, string>;
          ctaLabel?: string | Record<string, string>;
        };
        return (
          <BlockShell title="Callout">
            <div className="space-y-2">
              <EditableText
                value={getLocalizedValue(callout.title, locale)}
                className="text-sm font-semibold"
                onCommit={(next) =>
                  onUpdateComponent(component.id, (current) => ({
                    ...current,
                    title: setLocalizedValue(
                      (current as { title?: string | Record<string, string> }).title,
                      locale,
                      next,
                    ),
                  }))
                }
              />
              {callout.body ? (
                <EditableText
                  value={getLocalizedValue(callout.body, locale)}
                  className="text-sm text-muted-foreground"
                  onCommit={(next) =>
                    onUpdateComponent(component.id, (current) => ({
                      ...current,
                      body: setLocalizedValue(
                        (current as { body?: string | Record<string, string> }).body,
                        locale,
                        next,
                      ),
                    }))
                  }
                />
              ) : null}
              {callout.ctaLabel ? (
                <EditableText
                  value={getLocalizedValue(callout.ctaLabel, locale)}
                  className="text-xs font-semibold uppercase tracking-wide text-primary"
                  onCommit={(next) =>
                    onUpdateComponent(component.id, (current) => ({
                      ...current,
                      ctaLabel: setLocalizedValue(
                        (current as { ctaLabel?: string | Record<string, string> }).ctaLabel,
                        locale,
                        next,
                      ),
                    }))
                  }
                />
              ) : null}
            </div>
          </BlockShell>
        );
      }
      case "Section":
      case "Container":
      case "MultiColumn":
      case "Tabs": {
        return (
          <BlockShell title={component.type}>
            {hasChildren ? (
              <div className="space-y-2 border-l border-border/60 pl-3">
                {children!.map((child) => (
                  <div key={child.id}>{renderComponent(child)}</div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Empty layout container.</div>
            )}
          </BlockShell>
        );
      }
      default: {
        return (
          <BlockShell title={component.type}>
            <div className="text-xs text-muted-foreground">
              Preview not available for this block type.
            </div>
            {hasChildren && (
              <div className="space-y-2 border-l border-border/60 pl-3">
                {children!.map((child) => (
                  <div key={child.id}>{renderComponent(child)}</div>
                ))}
              </div>
            )}
          </BlockShell>
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      {page.components.map((component) => (
        <div key={component.id}>{renderComponent(component)}</div>
      ))}
    </div>
  );
}
