import React from "react";

const Link = React.forwardRef(function Link({ href, children, ...rest }, ref) {
  return (
    <a href={typeof href === "string" ? href : href?.pathname ?? "#"} ref={ref} {...rest}>
      {children}
    </a>
  );
});

export default Link;
export const __esModule = true;
