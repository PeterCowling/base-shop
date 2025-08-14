interface Props {
  position: number | null;
}

const SnapLine = ({ position }: Props) => {
  if (position === null) return null;
  return (
    <div
      className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary"
      style={{ left: position }}
    />
  );
};

export default SnapLine;
