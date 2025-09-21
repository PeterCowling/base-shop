import type { SocialLinksComponent } from "@acme/types";
import type { EditorProps } from "./EditorProps";
import { Input } from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";

type Props = EditorProps<SocialLinksComponent>;

export default function SocialLinksEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs<SocialLinksComponent>(onChange);
  return (
    <>
      <Input
        label="Facebook URL"
        value={component.facebook ?? ""}
        onChange={(e) => handleInput("facebook", e.target.value)}
      />
      <Input
        label="Instagram URL"
        value={component.instagram ?? ""}
        onChange={(e) => handleInput("instagram", e.target.value)}
      />
      <Input
        label="X URL"
        value={component.x ?? ""}
        onChange={(e) => handleInput("x", e.target.value)}
      />
      <Input
        label="YouTube URL"
        value={component.youtube ?? ""}
        onChange={(e) => handleInput("youtube", e.target.value)}
      />
      <Input
        label="LinkedIn URL"
        value={component.linkedin ?? ""}
        onChange={(e) => handleInput("linkedin", e.target.value)}
      />
    </>
  );
}
