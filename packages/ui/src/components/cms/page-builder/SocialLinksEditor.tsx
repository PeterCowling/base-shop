import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function SocialLinksEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <>
      <Input
        label="Facebook URL"
        value={(component as any).facebook ?? ""}
        onChange={(e) => handleInput("facebook", e.target.value)}
      />
      <Input
        label="Instagram URL"
        value={(component as any).instagram ?? ""}
        onChange={(e) => handleInput("instagram", e.target.value)}
      />
      <Input
        label="X URL"
        value={(component as any).x ?? ""}
        onChange={(e) => handleInput("x", e.target.value)}
      />
      <Input
        label="YouTube URL"
        value={(component as any).youtube ?? ""}
        onChange={(e) => handleInput("youtube", e.target.value)}
      />
      <Input
        label="LinkedIn URL"
        value={(component as any).linkedin ?? ""}
        onChange={(e) => handleInput("linkedin", e.target.value)}
      />
    </>
  );
}
