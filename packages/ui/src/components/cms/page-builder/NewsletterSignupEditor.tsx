import type { NewsletterSignupComponent } from "@acme/types";

import { Input } from "../../atoms/shadcn";
import LocalizedTextInput from "../LocalizedTextInput";

import type { EditorProps } from "./EditorProps";

type Props = EditorProps<NewsletterSignupComponent>;

export default function NewsletterSignupEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<NewsletterSignupComponent>);
  };

  return (
    <div className="space-y-2">
      <LocalizedTextInput
        label="Text"
        value={component.text ?? ""}
        onChange={(v) => handleInput("text", v)}
      />
      <Input
        value={component.action ?? ""}
        onChange={(e) => handleInput("action", e.target.value)}
        placeholder="action"
      />
      <LocalizedTextInput
        label="Placeholder"
        value={component.placeholder ?? ""}
        onChange={(v) => handleInput("placeholder", v)}
      />
      <LocalizedTextInput
        label="Submit label"
        value={component.submitLabel ?? ""}
        onChange={(v) => handleInput("submitLabel", v)}
      />
    </div>
  );
}
