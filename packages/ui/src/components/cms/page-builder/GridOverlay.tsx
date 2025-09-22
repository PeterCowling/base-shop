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
      className="pointer-events-none absolute inset-0 z-10 grid"
      data-cy="pb-grid-overlay"
      style={{
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
        <div key={i} className="border-muted-foreground/40 border-l border-dashed" />
      ))}
    </div>
  );
};

export default GridOverlay;
