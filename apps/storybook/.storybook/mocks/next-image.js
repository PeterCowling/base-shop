import React from "react";

function resolveStyle(style, fill) {
  if (!fill) return style;
  return {
    ...style,
    width: "100%",
    height: "100%",
    objectFit: style?.objectFit ?? "cover",
  };
}

export default function StorybookNextImage({
  src,
  alt = "",
  fill = false,
  style,
  ...rest
}) {
  const finalStyle = resolveStyle(style, fill);
  return React.createElement("img", {
    ...rest,
    src,
    alt,
    style: finalStyle,
  });
}
