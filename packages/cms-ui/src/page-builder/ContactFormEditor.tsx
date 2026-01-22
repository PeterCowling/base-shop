import { Input } from "@acme/design-system/shadcn";
import type { ContactFormComponent } from "@acme/types";

import type { EditorProps } from "./EditorProps";

type Props = EditorProps<ContactFormComponent>;

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
