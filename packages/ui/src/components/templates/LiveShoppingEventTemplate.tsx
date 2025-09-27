"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button, Input } from "../atoms/shadcn";
import type { SKU } from "@acme/types";
import { ProductCard } from "../organisms/ProductCard";
import { useTranslations } from "@acme/i18n";
import { Grid, Inline } from "../atoms/primitives";

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
  ctaLabel?: string;
}

export function LiveShoppingEventTemplate({
  streamUrl,
  products = [],
  chatMessages = [],
  onSendMessage,
  onAddToCart,
  ctaLabel,
  className,
  ...props
}: LiveShoppingEventTemplateProps) {
  const t = useTranslations();
  const addLabel = ctaLabel ?? t("actions.addToCart");
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
          <video src={streamUrl} controls className="h-full w-full" data-aspect="16/9" />
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
                  placeholder={t("live.chat.placeholder")}
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
            <p className="text-muted-foreground text-sm">
              {t("live.products.empty")}
            </p>
          )}
        </Grid>
      </div>
    </Grid>
  );
}
