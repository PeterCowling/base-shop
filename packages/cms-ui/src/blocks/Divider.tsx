interface Props {
  /** Thickness of the divider */
  height?: string;
}

export default function Divider({ height = "1px" }: Props) {
  return (
    <div
      aria-hidden="true"
      className="w-full bg-border"
      // eslint-disable-next-line react/forbid-dom-props -- DX-1234 dynamic divider thickness configured by CMS
      style={{ height }}
    />
  );
}
