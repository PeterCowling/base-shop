import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function NewsletterSignupEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        value={(component as any).text ?? ""}
        onChange={(e) => handleInput("text", e.target.value)}
        placeholder="text"
      />
      <Input
        value={(component as any).action ?? ""}
        onChange={(e) => handleInput("action", e.target.value)}
        placeholder="action"
      />
      <Input
        value={(component as any).placeholder ?? ""}
        onChange={(e) => handleInput("placeholder", e.target.value)}
        placeholder="placeholder"
      />
      <Input
        value={(component as any).submitLabel ?? ""}
        onChange={(e) => handleInput("submitLabel", e.target.value)}
        placeholder="submitLabel"
      />
    </div>
  );
}
