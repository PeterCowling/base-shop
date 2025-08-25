import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">404 – Page not found</h1>
      <p className="text-muted-foreground text-sm">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link
        href="/cms"
        className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-white"
      >
        Back to CMS
      </Link>
    </div>
  );
}
