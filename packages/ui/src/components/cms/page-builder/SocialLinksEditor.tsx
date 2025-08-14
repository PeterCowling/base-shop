import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function SocialLinksEditor({ component, onChange }: Props) {
  return (
    <>
      <Input
        label="Facebook URL"
        value={(component as any).facebook ?? ""}
        onChange={(e) => onChange({ facebook: e.target.value } as any)}
      />
      <Input
        label="Instagram URL"
        value={(component as any).instagram ?? ""}
        onChange={(e) => onChange({ instagram: e.target.value } as any)}
      />
      <Input
        label="X URL"
        value={(component as any).x ?? ""}
        onChange={(e) => onChange({ x: e.target.value } as any)}
      />
      <Input
        label="YouTube URL"
        value={(component as any).youtube ?? ""}
        onChange={(e) => onChange({ youtube: e.target.value } as any)}
      />
      <Input
        label="LinkedIn URL"
        value={(component as any).linkedin ?? ""}
        onChange={(e) => onChange({ linkedin: e.target.value } as any)}
      />
    </>
  );
}

