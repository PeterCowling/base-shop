import type { PageComponent } from "@types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function AnnouncementBarEditor({ component, onChange }: Props) {
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
        value={(component as any).link ?? ""}
        onChange={(e) => handleInput("link", e.target.value)}
        placeholder="link"
      />
    </div>
  );
}
