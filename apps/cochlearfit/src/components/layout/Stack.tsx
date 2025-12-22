import React from "react";

type StackProps = React.HTMLAttributes<HTMLDivElement>;

const Stack = React.memo(function Stack({ className, ...props }: StackProps) {
  const classes = ["flex", "flex-col", className].filter(Boolean).join(" ");
  return <div className={classes} {...props} />;
});

export default Stack;
