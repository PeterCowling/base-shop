interface Props {
  /** Thickness of the divider */
  height?: string;
}

export default function Divider({ height = "1px" }: Props) {
  return (
    <div
      aria-hidden="true"
      className="w-full bg-border"
       
      style={{ height }}
    />
  );
}
