// src/components/common/Page.tsx
import type React from "react";

function Page({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={`mx-auto mt-20 max-w-md px-4 text-center${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}

export default Page;
