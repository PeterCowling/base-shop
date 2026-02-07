"use client"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: Next.js directive string
import * as React from "react";

import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@acme/i18n/resolveText";
import type { SKU } from "@acme/types";
import type { TranslatableText } from "@acme/types/i18n";

import { cn } from "../../utils/style";
import { Grid, Inline } from "../atoms/primitives";
import { Button, Input } from "../atoms/shadcn";
import { ProductCard } from "../organisms/ProductCard";

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
}

export interface LiveShoppingEventTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  streamUrl: string;
  products?: SKU[];
  chatMessages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  onAddToCart?: (product: SKU) => void;
  ctaLabel?: TranslatableText;
  locale?: Locale;
}

export function LiveShoppingEventTemplate({
  streamUrl,
  products = [],
  chatMessages = [],
  onSendMessage,
  onAddToCart,
  ctaLabel,
  locale = "en",
  className,
  ...props
}: LiveShoppingEventTemplateProps) {
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
  const addLabel = (() => {
    if (!ctaLabel) {
      const v = t("actions.addToCart");
      return typeof v === "string" ? v : "Add to cart"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: fallback when key unresolved
    }
    if (typeof ctaLabel === "string") return ctaLabel;
    if (ctaLabel.type === "key") return t(ctaLabel.key, ctaLabel.params);
    if (ctaLabel.type === "inline") return resolveText(ctaLabel, locale, t);
    return "Add to cart"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: defensive fallback
  })();
  const [message, setMessage] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    onSendMessage?.(text);
    setMessage("");
  }

  return (
    <Grid cols={1} gap={6} className={cn("lg:grid-cols-3", className)} {...props}>
      <div className="space-y-4 lg:col-span-2">
        <div className="aspect-video w-full bg-fg">
          <video src={streamUrl} controls className="h-full w-full" data-aspect="16/9">
            {/* i18n-exempt: placeholder captions track for accessibility tooling */}
            { }
            <track
              kind="captions"
              srcLang="en"
              label={t("captions.english") as string}
              src="data:text/vtt;base64,"
              default
            />
            { }
          </video>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t("live.chat.title")}</h3>
          <div className="h-64 space-y-2 overflow-y-auto rounded-md border bg-bg p-4">
            {chatMessages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="me-1 font-medium">{m.user}:</span>
                <span>{m.message}</span>
              </div>
            ))}
            {chatMessages.length === 0 && (
              <p className="text-muted-foreground text-sm">{t("live.chat.empty")}</p>
            )}
          </div>
          {onSendMessage && (
            <form onSubmit={handleSubmit}>
              <Inline gap={2}>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("live.chat.placeholder") as string}
                  className="flex-1"
                />
                <Button type="submit">{t("actions.send")}</Button>
              </Inline>
            </form>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t("live.products.title")}</h3>
        <Grid cols={1} gap={4}>
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={onAddToCart}
              ctaLabel={addLabel}
            />
          ))}
          {products.length === 0 && (
            <p className="text-muted-foreground text-sm">{t("live.products.empty")}</p>
          )}
        </Grid>
      </div>
    </Grid>
  );
}
