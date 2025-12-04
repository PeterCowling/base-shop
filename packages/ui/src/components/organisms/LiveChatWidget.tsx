"use client"; // i18n-exempt -- PB-000 [ttl=2025-12-31]: Next.js directive string

import * as React from "react";
import { cn } from "../../utils/style";
import { Button, Input } from "../atoms/shadcn";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle, DrawerDescription, DrawerPortal } from "../atoms/primitives/drawer";
import { OverlayScrim } from "../atoms";
import { useTranslations } from "@acme/i18n";
import { Stack } from "../atoms/primitives/Stack";
import { Inline } from "../atoms/primitives/Inline";
import Image from "next/image";

interface ChatMessage {
  id: number;
  sender: "user" | "bot";
  text: string;
}

export interface LiveChatWidgetProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  /**
   * Width of the chat dialog. Provide a Tailwind width class
   * (e.g. "w-80") or a numeric pixel value.
   * @default "w-80"
   */
  width?: string | number;
  /**
   * Distance from the bottom of the viewport for both the
   * toggle button and the chat dialog. Accepts a Tailwind
   * class like "bottom-4" or a numeric pixel value.
   * @default "bottom-4"
   */
  bottomOffset?: string | number;
  /** Optional headline for the chat drawer */
  title?: string;
  /** Optional subtitle shown under the title */
  subtitle?: string;
  /** Optional avatar shown next to the title */
  avatarUrl?: string;
  /** Whether the agent is online (renders a tiny status dot) */
  online?: boolean;
}

/**
 * Simple live chat widget with a toggle button and minimal conversation UI.
 */
export function LiveChatWidget({
  className,
  width = "w-80",
  bottomOffset = "bottom-4",
  title,
  subtitle,
  avatarUrl,
  online,
  ...buttonProps
}: LiveChatWidgetProps) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const nextId = React.useRef(0);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { id: nextId.current++, sender: "user", text },
      { id: nextId.current++, sender: "bot", text: String(t("chat.autoReply")) },
    ]);
    setInput("");
  };

  // Pass width directly; DrawerContent handles numeric widths via inline style
  const widthProp = width;

  const bottomClass =
    typeof bottomOffset === "string" && bottomOffset.startsWith("bottom-")
      ? bottomOffset
      : undefined;
  const bottomStyle = bottomClass ? undefined : { bottom: bottomOffset };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          className={cn(
            "fixed end-4 z-50 rounded-full shadow-elevation-3", // i18n-exempt -- PB-000 [ttl=2025-12-31]: CSS utility classes only
            bottomClass,
            className
          )}
          style={bottomStyle}
          {...buttonProps}
        >
          {t("chat.trigger")}
        </Button>
      </DrawerTrigger>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent
        style={{ ...bottomStyle }}
        side="right" /* i18n-exempt -- PB-000 [ttl=2025-12-31]: UI enum value */
        width={widthProp}
        className={cn("flex flex-col gap-4 border-border-2 p-6 shadow-elevation-3", bottomClass)} // i18n-exempt -- PB-000 [ttl=2025-12-31]: CSS utility classes only
        data-token="--color-bg" /* i18n-exempt -- PB-000 [ttl=2025-12-31]: design token attribute */
      >
        <Inline gap={3} alignY="center" className="items-start">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted" aria-hidden={!avatarUrl}>
            {avatarUrl ? (
              <Image src={avatarUrl} alt={title ?? (t("chat.title") as string)} fill className="object-cover" />
            ) : null}
          </div>
          <div className="flex-1">
            <DrawerTitle className="text-lg font-semibold">
              {title ?? (t("chat.title") as string)}
            </DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              {subtitle ?? (t("chat.description") as string)}
            </DrawerDescription>
          </div>
          {online !== undefined ? (
            <span
              className={cn(
                "mt-1 inline-flex h-2.5 w-2.5 rounded-full", // i18n-exempt -- PB-000 [ttl=2025-12-31]: CSS utility classes only
                online ? "bg-success" : "bg-muted"
              )} // i18n-exempt -- PB-000 [ttl=2025-12-31]: design tokens only
              aria-label={online ? t("status.active") : t("status.archived")}
            />
          ) : null}
        </Inline>
        <Stack gap={2} className="overflow-y-auto py-2">{/* i18n-exempt: CSS utility classes only */}
          {messages.map((m) => (
            <div
              key={m.id}
              className={m.sender === "user" ? "self-end" : "self-start"}
            >
              <div
                className={cn(
                  "rounded px-3 py-1 text-sm", // i18n-exempt -- PB-000 [ttl=2025-12-31]: CSS utility classes only
                  m.sender === "user"
                    ? "bg-primary text-primary-foreground" // i18n-exempt -- PB-000 [ttl=2025-12-31]: CSS utility classes only
                    : "bg-muted" // i18n-exempt -- PB-000 [ttl=2025-12-31]: CSS utility classes only
                )}
                data-token={
                  m.sender === "user" ? "--color-primary" : "--color-muted"
                }
              >
                {m.text}
              </div>
            </div>
          ))}
        </Stack>
        <Inline gap={2}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.placeholder") as string}
            className="flex-1"
          />
          <Button onClick={send}>{t("chat.send")}</Button>
        </Inline>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
