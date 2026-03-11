// src/components/common/Page.tsx
import type React from "react";
import clsx from "clsx";

function Page({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={clsx("mx-auto mt-20 max-w-md px-4 text-center", className)}
      {...props}
    />
  );
}

export default Page;
