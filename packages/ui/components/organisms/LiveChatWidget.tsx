"use client";

import * as React from "react";
import { cn } from "../../utils/cn";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from "../atoms-shim";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

export interface LiveChatWidgetProps
  extends React.HTMLAttributes<HTMLButtonElement> {}

/**
 * Simple live chat widget with a toggle button and minimal conversation UI.
 */
export function LiveChatWidget({ className, ...props }: LiveChatWidgetProps) {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "fixed right-4 bottom-4 z-50 rounded-full shadow-lg",
            className
          )}
          {...props}
        >
          Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="flex w-80 flex-col gap-4">
        <DialogHeader>
          <DialogTitle>How can we help?</DialogTitle>
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
