interface Props {
  position: number | null;
}

const SnapLine = ({ position }: Props) =>
  position !== null ? (
    <div
      className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary"
      style={{ left: position }}
    />
  ) : null;

export default SnapLine;

