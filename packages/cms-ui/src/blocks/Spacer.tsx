import * as React from "react";

interface Props {
  /** Amount of vertical space */
  height?: string;
}

export default function Spacer({ height = "1rem" }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  // Set inline height imperatively to avoid using the `style` prop on DOM nodes
  React.useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.height = height;
    }
  }, [height]);

  return <div aria-hidden="true" ref={ref} />;
}
