import type { SocialLinksComponent } from "@acme/types";
import type { EditorProps } from "./EditorProps";
import { Input } from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";

type Props = EditorProps<SocialLinksComponent>;

export default function SocialLinksEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs<SocialLinksComponent>(onChange);
  // i18n-exempt — Editor-only field labels; not user-facing site copy
  /* i18n-exempt */ const t = (s: string) => s;
  return (
    <>
      <Input
        label={t("Facebook URL")}
        value={component.facebook ?? ""}
        onChange={(e) => handleInput("facebook", e.target.value)}
      />
      <Input
        label={t("Instagram URL")}
        value={component.instagram ?? ""}
        onChange={(e) => handleInput("instagram", e.target.value)}
      />
      <Input
        label={t("X URL")}
        value={component.x ?? ""}
        onChange={(e) => handleInput("x", e.target.value)}
      />
      <Input
        label={t("YouTube URL")}
        value={component.youtube ?? ""}
        onChange={(e) => handleInput("youtube", e.target.value)}
      />
      <Input
        label={t("LinkedIn URL")}
        value={component.linkedin ?? ""}
        onChange={(e) => handleInput("linkedin", e.target.value)}
      />
    </>
  );
}
