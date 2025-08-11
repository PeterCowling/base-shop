interface Props {
  /** Amount of vertical space */
  height?: string;
}

export default function Spacer({ height = "1rem" }: Props) {
  return <div aria-hidden="true" style={{ height }} />;
}
