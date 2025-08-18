import type { ContactFormComponent } from "@acme/types/src/page/molecules";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: ContactFormComponent;
  onChange: (patch: Partial<ContactFormComponent>) => void;
}

export default function ContactFormEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<ContactFormComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        value={component.action ?? ""}
        onChange={(e) => handleInput("action", e.target.value)}
        placeholder="action"
      />
      <Input
        value={component.method ?? ""}
        onChange={(e) => handleInput("method", e.target.value)}
        placeholder="method"
      />
    </div>
  );
}
