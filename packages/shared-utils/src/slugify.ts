import slugifyLib from "slugify";

/** Convert a string into a URL-friendly slug using the `slugify` package. */
export default function slugify(str: string): string {
  return slugifyLib(str.replace(/_/g, " "), { lower: true, strict: true });
}
