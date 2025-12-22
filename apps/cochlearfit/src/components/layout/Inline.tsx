import React from "react";

type InlineProps = React.HTMLAttributes<HTMLDivElement>;

const Inline = React.memo(function Inline({ className, ...props }: InlineProps) {
  const classes = ["flex", className].filter(Boolean).join(" ");
  return <div className={classes} {...props} />;
});

export default Inline;
