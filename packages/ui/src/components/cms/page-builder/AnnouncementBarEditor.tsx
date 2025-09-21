import type { AnnouncementBarComponent } from "@acme/types";
import type { EditorProps } from "./EditorProps";
import { Input } from "../../atoms/shadcn";

type Props = EditorProps<AnnouncementBarComponent>;

export default function AnnouncementBarEditor({ component, onChange }: Props) {
  const handleInput = (field: keyof AnnouncementBarComponent & string, value: string) => {
    onChange({ [field]: value } as Partial<AnnouncementBarComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        value={component.text ?? ""}
        onChange={(e) => handleInput("text", e.target.value)}
        placeholder="text"
      />
      <Input
        value={component.link ?? ""}
        onChange={(e) => handleInput("link", e.target.value)}
        placeholder="link"
      />
    </div>
  );
}
