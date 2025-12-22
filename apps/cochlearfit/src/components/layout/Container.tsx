import React, { useMemo } from "react";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

const Container = React.memo(function Container({
  children,
  className,
}: ContainerProps) {
  const classes = useMemo(() => {
    const base = ["mx-auto", "w-full", "max-w-md", "px-4"];
    return [...base, className].filter(Boolean).join(" ");
  }, [className]);

  return <div className={classes}>{children}</div>;
});

export default Container;
