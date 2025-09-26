"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button, Input } from "../atoms/shadcn";
import type { SKU } from "@acme/types";
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
  ctaLabel?: string;
}

export function LiveShoppingEventTemplate({
  streamUrl,
  products = [],
  chatMessages = [],
  onSendMessage,
  onAddToCart,
  ctaLabel = "Add to cart",
  className,
  ...props
}: LiveShoppingEventTemplateProps) {
  const [message, setMessage] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    onSendMessage?.(text);
    setMessage("");
  }

  return (
    <div className={cn("grid gap-6 lg:grid-cols-3", className)} {...props}>
      <div className="space-y-4 lg:col-span-2">
        <div className="aspect-video w-full bg-fg">
          <video src={streamUrl} controls className="h-full w-full" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Chat</h3>
          <div className="h-64 space-y-2 overflow-y-auto rounded-md border bg-bg p-4">
            {chatMessages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="me-1 font-medium">{m.user}:</span>
                <span>{m.message}</span>
              </div>
            ))}
            {chatMessages.length === 0 && (
              <p className="text-muted-foreground text-sm">No messages yet.</p>
            )}
          </div>
          {onSendMessage && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say something…"
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </form>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Products</h3>
        <div className="grid gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={onAddToCart}
              ctaLabel={ctaLabel}
            />
          ))}
          {products.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No products currently highlighted.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
