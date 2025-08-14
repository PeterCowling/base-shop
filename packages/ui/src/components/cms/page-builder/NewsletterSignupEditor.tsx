import type { NewsletterSignupComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: NewsletterSignupComponent;
  onChange: (patch: Partial<NewsletterSignupComponent>) => void;
}

export default function NewsletterSignupEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<NewsletterSignupComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        value={component.text ?? ""}
        onChange={(e) => handleInput("text", e.target.value)}
        placeholder="text"
      />
      <Input
        value={component.action ?? ""}
        onChange={(e) => handleInput("action", e.target.value)}
        placeholder="action"
      />
      <Input
        value={component.placeholder ?? ""}
        onChange={(e) => handleInput("placeholder", e.target.value)}
        placeholder="placeholder"
      />
      <Input
        value={component.submitLabel ?? ""}
        onChange={(e) => handleInput("submitLabel", e.target.value)}
        placeholder="submitLabel"
      />
    </div>
  );
}
