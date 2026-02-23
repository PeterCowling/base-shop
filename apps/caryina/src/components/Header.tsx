import Link from "next/link";

import { BrandMark } from "@/components/BrandMark/BrandMark";

export function Header() {
  return (
    <header
      className="flex items-center gap-4 border-b border-solid px-6 py-4"
      style={{
        borderBottomColor: "hsl(var(--color-border-muted))",
      }}
    >
      <Link href="/" aria-label="Carina" style={{ display: "inline-flex" }}>
        <BrandMark trigger="mount" />
      </Link>
    </header>
  );
}
