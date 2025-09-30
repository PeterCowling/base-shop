// i18n-exempt -- Storybook demo copy; not user-visible in production
import { type Meta, type StoryObj } from "@storybook/react";
import * as React from "react";
import { cn } from "../../utils/style";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from "../atoms/shadcn";
import { LiveChatWidget } from "./LiveChatWidget";
import { Stack } from "../atoms/primitives/Stack";
import { Inline } from "../atoms/primitives/Inline";

interface ChatMessage {
  id: number;
  sender: "user" | "bot";
  text: string;
}

function FakeLiveChatWidget(props: React.HTMLAttributes<HTMLButtonElement>) {
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
      { id: nextId.current++, sender: "bot", text: "Thanks for your message!" },
    ]);
    setInput("");
  };

  React.useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: nextId.current++, sender: "bot", text: "Hello from support" },
      ]);
    }, 1000);
    return () => clearTimeout(id);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "fixed end-4 bottom-4 z-50 rounded-full shadow-elevation-3",
            props.className
          )}
          {...props}
        >
          Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="w-80">
        <DialogHeader>
          <DialogTitle>How can we help?</DialogTitle>
        </DialogHeader>
        <Stack gap={4}>
          <Stack gap={2} className="overflow-y-auto py-2">
            {messages.map((m) => (
              <div
                key={m.id}
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
          </Stack>
          <Inline gap={2}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1"
            />
            <Button onClick={send}>Send</Button>
          </Inline>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

const meta = {
  component: LiveChatWidget,
  render: (args) => <FakeLiveChatWidget {...args} />,
} satisfies Meta<typeof LiveChatWidget>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
