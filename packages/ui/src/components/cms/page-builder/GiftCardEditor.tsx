import { useTranslations } from "@acme/i18n";
import type { GiftCardBlockComponent } from "@acme/types";

import { Input, Textarea } from "../../atoms/shadcn";

import type { EditorProps } from "./EditorProps";

type Props = EditorProps<GiftCardBlockComponent>;

export default function GiftCardEditor({ component, onChange }: Props) {
  const t = useTranslations();
  return (
    <div className="space-y-2">
      <Input
        value={component.denominations?.join(",") ?? ""}
        onChange={(e) =>
          onChange({
            denominations: e.target.value
              .split(/[\s,]+/)
              .map((s) => parseInt(s.trim(), 10))
              .filter((n) => !isNaN(n)),
          } as Partial<GiftCardBlockComponent>)
        }
        placeholder={t("Amounts (comma separated)") as string}
      />
      <Textarea
        value={component.description ?? ""}
        onChange={(e) => onChange({ description: e.target.value } as Partial<GiftCardBlockComponent>)}
        placeholder={t("Description") as string}
      />
    </div>
  );
}
