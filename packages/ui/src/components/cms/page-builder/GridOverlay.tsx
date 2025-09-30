/* eslint-disable react/forbid-dom-props -- PB-2416: grid overlay needs dynamic inline styles */

interface Props {
  gridCols: number;
  gutter?: string;
  /** Draw horizontal baseline lines every N px on top */
  baselineStep?: number;
}

const GridOverlay = ({ gridCols, gutter, baselineStep }: Props) => {
  const cols =
    Number.isFinite(gridCols) && gridCols > 0 ? Math.floor(gridCols) : 1;
  return (
    <div
      className="pointer-events-none absolute inset-0"
      data-cy={/* i18n-exempt -- PB-2416 */ "pb-grid-overlay"}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        ...(gutter ? { columnGap: gutter } : {}),
        ...(baselineStep && baselineStep > 0
          ? {
              backgroundImage: `repeating-linear-gradient(to bottom, hsl(var(--muted-foreground, 0 0% 45%)/.35) 0, hsl(var(--muted-foreground, 0 0% 45%)/.35) 1px, transparent 1px, transparent ${baselineStep}px)`,
            }
          : {}),
      }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key -- PB-2416: column order fixed, purely decorative
        <div key={i} className="border-muted-foreground/40 border-l border-dashed" />
      ))}
    </div>
  );
};

export default GridOverlay;

/* eslint-enable react/forbid-dom-props */
