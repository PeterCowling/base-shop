"use client";

import * as React from "react";
import { cn } from "../../utils/style";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from "../atoms/shadcn";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

export interface LiveChatWidgetProps
  extends React.HTMLAttributes<HTMLButtonElement> {
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
}

/**
 * Simple live chat widget with a toggle button and minimal conversation UI.
 */
export function LiveChatWidget({
  className,
  width = "w-80",
  bottomOffset = "bottom-4",
  ...props
}: LiveChatWidgetProps) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { sender: "user", text },
      { sender: "bot", text: "Thanks for your message!" },
    ]);
    setInput("");
  };

  const widthClass = typeof width === "number" ? `w-[${width}px]` : width;
  const widthStyle = typeof width === "number" ? { width } : undefined;

  const bottomClass =
    typeof bottomOffset === "string" && bottomOffset.startsWith("bottom-")
      ? bottomOffset
      : undefined;
  const bottomStyle = bottomClass ? undefined : { bottom: bottomOffset };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "fixed right-4 z-50 rounded-full shadow-lg",
            bottomClass,
            className
          )}
          style={bottomStyle}
          {...props}
        >
          Chat
        </Button>
      </DialogTrigger>
      <DialogContent
        style={{ ...widthStyle, ...bottomStyle }}
        className={cn(
          "bg-surface-3 fixed right-4 flex flex-col gap-4 border border-border-2 p-6 shadow-lg",
          widthClass,
          bottomClass
        )}
        data-token="--color-bg"
      >
        {" "}
        <DialogHeader>
          <DialogTitle>How can we help?</DialogTitle>
          <DialogDescription className="sr-only">
            Chat with our support team
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 overflow-y-auto py-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.sender === "user" ? "self-end" : "self-start"}
            >
              <div
                className={cn(
                  "rounded px-3 py-1 text-sm",
                  m.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
                data-token={
                  m.sender === "user" ? "--color-primary" : "--color-muted"
                }
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1"
          />
          <Button onClick={send}>Send</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
