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
      <div className="text-xs font-semibold text-muted-foreground">Cursor</div>
      <div className="flex items-center gap-2">
        <select
          aria-label="Cursor"
          className="rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            onCursorChange(next === "default" ? undefined : next);
          }}
        >
          <option value="default">Default</option>
          <option value="pointer">Pointer</option>
          <option value="text">Text</option>
          <option value="move">Move</option>
          <option value="crosshair">Crosshair</option>
          <option value="not-allowed">Not allowed</option>
          <option value="grab">Grab</option>
          <option value="custom">Custom…</option>
        </select>
        {isCustom ? (
          <input
            type="text"
            className="w-64 rounded border px-2 py-1 text-sm"
            placeholder="Cursor image URL"
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
