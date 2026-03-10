import { notFound } from "next/navigation";

// Static export compatibility: catch-all requires generateStaticParams
export const dynamicParams = false;

export async function generateStaticParams() {
  // This is a legacy route kept for backwards compatibility with old inbound links.
  // For static export, Next requires at least one concrete path for dynamic routes.
  // We generate a single placeholder path per locale; the page always 404s.
  return [{ slug: ["_"] }];
}

export default function LegacyGuidesNotFound() {
  notFound();
}
