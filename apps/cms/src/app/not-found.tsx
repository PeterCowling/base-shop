import Link from "next/link";
import type { ReactElement } from "react";

// This function must return a JSX element.
export default function NotFound(): ReactElement {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">404 – Page not found</h1>
      <p className="text-muted-foreground text-sm">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link
        href="/cms"
        className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-primary-foreground"
      >
        Back to CMS
      </Link>
    </div>
  );
}
