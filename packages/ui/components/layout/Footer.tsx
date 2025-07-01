// src/components/layout/Footer.tsx
import Link from "next/link";
import { memo } from "react";
import { cn } from "../../utils/cn";

const Footer = memo(function Footer({
  height = "h-16",
  padding = "",
}: {
  height?: string;
  padding?: string;
}) {
  return (
    <footer
      className={cn(
        "flex items-center justify-center bg-gray-100 text-sm text-gray-500",
        height,
        padding
      )}
    >
      {" "}
      <p className="space-x-4">
        <Link href="/legal/privacy" className="hover:underline">
          Privacy
        </Link>
        <span>&middot;</span>
        <Link href="/legal/terms" className="hover:underline">
          Terms
        </Link>
      </p>
    </footer>
  );
});

export default Footer;
