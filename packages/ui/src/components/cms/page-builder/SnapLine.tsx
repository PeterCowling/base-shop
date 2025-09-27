interface Props {
  /** X-coordinate for a vertical snap line */
  x?: number | null;
  /** Y-coordinate for a horizontal snap line */
  y?: number | null;
}

const SnapLine = ({ x = null, y = null }: Props) => {
  if (x === null && y === null) return null;
  return (
    <>
      {x !== null && (
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary"
          style={{ left: x }}
        />
      )}
      {y !== null && (
        <div
          className="pointer-events-none absolute start-0 end-0 h-px bg-primary"
          style={{ top: y }}
        />
      )}
    </>
  );
};

export default SnapLine;
