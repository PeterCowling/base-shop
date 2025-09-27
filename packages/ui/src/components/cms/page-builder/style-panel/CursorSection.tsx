interface CursorSectionProps {
  cursor: string | undefined;
  cursorUrl: string | undefined;
  onCursorChange: (value: string | undefined) => void;
  onCursorUrlChange: (value: string | undefined) => void;
}

export default function CursorSection({ cursor, cursorUrl, onCursorChange, onCursorUrlChange }: CursorSectionProps) {
  const value = cursor ?? "default";
  const isCustom = value === "custom";

  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-muted-foreground">{/* i18n-exempt — editor-only style label */}Cursor</div>
      <div className="flex items-center gap-2">
        <select
          aria-label={/* i18n-exempt — editor-only control label */ "Cursor"}
          className="rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            onCursorChange(next === "default" ? undefined : next);
          }}
        >
          <option value="default">{/* i18n-exempt */}Default</option>
          <option value="pointer">{/* i18n-exempt */}Pointer</option>
          <option value="text">{/* i18n-exempt */}Text</option>
          <option value="move">{/* i18n-exempt */}Move</option>
          <option value="crosshair">{/* i18n-exempt */}Crosshair</option>
          <option value="not-allowed">{/* i18n-exempt */}Not allowed</option>
          <option value="grab">{/* i18n-exempt */}Grab</option>
          <option value="custom">{/* i18n-exempt */}Custom…</option>
        </select>
        {isCustom ? (
          <input
            type="text"
            className="w-64 rounded border px-2 py-1 text-sm"
            placeholder={/* i18n-exempt */ "Cursor image URL"}
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
