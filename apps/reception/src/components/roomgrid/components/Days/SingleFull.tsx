import type { FC } from "react";

import type { TDaysProps } from "./Days.interface";

const SingleFull: FC<TDaysProps> = ({ topColor }) => {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-testid="single.full"
    >
      <rect width="48" height="48" rx="2" fill={topColor} />
    </svg>
  );
};

export { SingleFull };
