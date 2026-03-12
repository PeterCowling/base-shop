import { headers } from "next/headers";
import Link from "next/link";

function detectLocale(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})\//);
  return match?.[1] ?? "en";
}

export default async function NotFound() {
  const headerList = await headers();
  const pathname = headerList.get("x-next-url") ?? headerList.get("x-invoke-path") ?? "/en";
  const lang = detectLocale(pathname);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p
        className="text-7xl font-light tracking-tight"
        style={{ fontFamily: "var(--font-cormorant-garamond, serif)" }}
      >
        404
      </p>
      <h1
        className="mt-4 text-2xl font-light"
        style={{
          fontFamily: "var(--font-cormorant-garamond, serif)",
          color: "hsl(var(--color-fg-muted))",
        }}
      >
        Page not found
      </h1>
      <p
        className="mt-3 max-w-sm text-sm"
        style={{ color: "hsl(var(--color-fg-muted))" }}
      >
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href={`/${lang}/shop`}
        className="btn-primary mt-8 rounded-full px-6 py-2.5 text-sm"
      >
        Back to shop
      </Link>
    </div>
  );
}
