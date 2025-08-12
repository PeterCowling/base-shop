import type { PageComponent } from "@acme/types";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function SocialFeedEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value || undefined } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Select
        value={(component as any).provider ?? ""}
        onValueChange={(v) => handleInput("provider", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Provider" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="instagram">Instagram</SelectItem>
          <SelectItem value="twitter">Twitter</SelectItem>
        </SelectContent>
      </Select>
      <Input
        label="Account"
        value={(component as any).account ?? ""}
        onChange={(e) => handleInput("account", e.target.value)}
      />
      <Input
        label="Hashtag"
        value={(component as any).hashtag ?? ""}
        onChange={(e) => handleInput("hashtag", e.target.value)}
      />
    </div>
  );
}

