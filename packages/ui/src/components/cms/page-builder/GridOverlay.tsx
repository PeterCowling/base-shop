interface Props {
  gridCols: number;
  gutter?: string;
}

const GridOverlay = ({ gridCols, gutter }: Props) => {
  const cols =
    Number.isFinite(gridCols) && gridCols > 0 ? Math.floor(gridCols) : 1;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 grid"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, ...(gutter ? { columnGap: gutter } : {}) }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="border-muted-foreground/40 border-l border-dashed"
        />
      ))}
    </div>
  );
};

export default GridOverlay;
