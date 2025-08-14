interface Props {
  gridCols: number;
}

const GridOverlay = ({ gridCols }: Props) => (
  <div
    className="pointer-events-none absolute inset-0 z-10 grid"
    style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
  >
    {Array.from({ length: gridCols }).map((_, i) => (
      <div
        key={i}
        className="border-l border-dashed border-muted-foreground/40"
      />
    ))}
  </div>
);

export default GridOverlay;

