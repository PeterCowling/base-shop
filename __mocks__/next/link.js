import React from "react";

const Link = React.forwardRef(function Link({ href, children, ...rest }, ref) {
  return React.createElement(
    "a",
    {
      href: typeof href === "string" ? href : href?.pathname ?? "#",
      ref,
      ...rest,
    },
    children,
  );
});

export default Link;
