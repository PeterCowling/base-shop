// src/components/layout/Footer.tsx
import Link from "next/link";
import { memo } from "react";
import { cn } from "../../utils/style";

const Footer = memo(function Footer({
  height = "h-16",
  padding = "",
}: {
  height?: string;
  padding?: string;
}) {
  return (
    <footer
      data-token="--color-muted"
      className={cn(
        "flex items-center justify-center bg-muted text-sm text-muted",
        height,
        padding
      )}
    >
      {" "}
      <p className="space-x-4">
        <Link
          href="/legal/privacy"
          className="hover:underline"
          data-token="--color-fg"
        >
          Privacy
        </Link>
        <span>&middot;</span>
        <Link
          href="/legal/terms"
          className="hover:underline"
          data-token="--color-fg"
        >
          Terms
        </Link>
      </p>
    </footer>
  );
});

export default Footer;
