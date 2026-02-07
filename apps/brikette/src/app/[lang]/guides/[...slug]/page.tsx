import { notFound } from "next/navigation";

// Static export compatibility: catch-all requires generateStaticParams
export async function generateStaticParams() {
  return [];
}

export default function LegacyGuidesNotFound() {
  notFound();
}
