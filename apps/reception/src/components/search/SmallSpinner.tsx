import React from "react";

const SmallSpinner: React.FC = () => (
  <div
    className="w-4 h-4 border-2 border-gray-300 border-t-primary-main rounded-full animate-spin dark:border-darkSurface"
    role="status"
    aria-label="Loading"
  />
);

export default React.memo(SmallSpinner);
