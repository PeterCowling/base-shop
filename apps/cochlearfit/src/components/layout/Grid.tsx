import React from "react";

type GridProps = React.HTMLAttributes<HTMLDivElement>;

const Grid = React.memo(function Grid({ className, ...props }: GridProps) {
  const classes = ["grid", className].filter(Boolean).join(" ");
  return <div className={classes} {...props} />;
});

export default Grid;
