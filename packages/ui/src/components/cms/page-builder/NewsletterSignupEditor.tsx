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
        value={(component as any).placeholder ?? ""}
        onChange={(e) => handleInput("placeholder", e.target.value)}
        placeholder="placeholder"
      />
      <Input
        value={(component as any).buttonText ?? ""}
        onChange={(e) => handleInput("buttonText", e.target.value)}
        placeholder="buttonText"
      />
      <Input
        value={(component as any).action ?? ""}
        onChange={(e) => handleInput("action", e.target.value)}
        placeholder="action"
      />
    </div>
  );
}
