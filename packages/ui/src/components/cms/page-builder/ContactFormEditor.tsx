import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ContactFormEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        value={(component as any).action ?? ""}
        onChange={(e) => handleInput("action", e.target.value)}
        placeholder="action"
      />
      <Input
        value={(component as any).method ?? ""}
        onChange={(e) => handleInput("method", e.target.value)}
        placeholder="method"
      />
    </div>
  );
}
