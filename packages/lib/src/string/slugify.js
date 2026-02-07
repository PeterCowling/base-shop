/**
 * Convert a string into a URL-friendly slug.
 *
 * The implementation normalizes accented characters, removes non-alphanumeric
 * symbols, collapses whitespace/underscores to hyphens and trims extraneous
 * hyphens from the start and end of the resulting string.
 */
export default function slugify(str) {
    if (!str)
        return "";
    return str
        .normalize("NFKD")
        // Remove diacritical marks
        .replace(/[\u0300-\u036f]/g, "")
        // Convert underscores to spaces so they're treated as separators
        .replace(/_/g, " ")
        // Drop all non-word characters except whitespace and dashes
        .replace(/[^\w\s-]/g, "")
        .trim()
        // Collapse spaces and dashes to a single dash
        .replace(/[\s-]+/g, "-")
        // Remove leading/trailing dashes
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
}
