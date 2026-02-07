import { useTranslations } from "@acme/i18n";

interface CursorSectionProps {
  cursor: string | undefined;
  cursorUrl: string | undefined;
  onCursorChange: (value: string | undefined) => void;
  onCursorUrlChange: (value: string | undefined) => void;
}

export default function CursorSection({ cursor, cursorUrl, onCursorChange, onCursorUrlChange }: CursorSectionProps) {
  const t = useTranslations();
  const value = cursor ?? "default";
  const isCustom = value === "custom";

  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-muted-foreground">{t("cms.builder.style.cursor.label")}</div>
      <div className="flex items-center gap-2">
        <select
          aria-label={t("cms.builder.style.cursor.selectAria") as string}
          className="rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            onCursorChange(next === "default" ? undefined : next);
          }}
        >
          <option value="default">{t("cms.builder.style.cursor.option.default")}</option>
          <option value="pointer">{t("cms.builder.style.cursor.option.pointer")}</option>
          <option value="text">{t("cms.builder.style.cursor.option.text")}</option>
          <option value="move">{t("cms.builder.style.cursor.option.move")}</option>
          <option value="crosshair">{t("cms.builder.style.cursor.option.crosshair")}</option>
          <option value="not-allowed">{t("cms.builder.style.cursor.option.notAllowed")}</option>
          <option value="grab">{t("cms.builder.style.cursor.option.grab")}</option>
          <option value="custom">{t("cms.builder.style.cursor.option.custom")}</option>
        </select>
        {isCustom ? (
          <input
            type="text"
            className="w-64 rounded border px-2 py-1 text-sm"
            placeholder={t("cms.builder.style.cursor.urlPlaceholder") as string}
            value={cursorUrl ?? ""}
            onChange={(event) => {
              const next = event.target.value;
              onCursorUrlChange(next ? next : undefined);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
