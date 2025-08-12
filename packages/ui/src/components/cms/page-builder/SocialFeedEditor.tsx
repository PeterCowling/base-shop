import type { PageComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function SocialFeedEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Select
        value={(component as any).platform ?? ""}
        onValueChange={(v) => handleInput("platform", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="twitter">twitter</SelectItem>
          <SelectItem value="instagram">instagram</SelectItem>
        </SelectContent>
      </Select>
      <Input
        value={(component as any).account ?? ""}
        onChange={(e) => handleInput("account", e.target.value)}
        placeholder="account"
      />
      <Input
        value={(component as any).hashtag ?? ""}
        onChange={(e) => handleInput("hashtag", e.target.value)}
        placeholder="hashtag"
      />
    </div>
  );
}

