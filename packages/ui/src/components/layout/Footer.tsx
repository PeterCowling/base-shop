// src/components/layout/Footer.tsx
import Link from "next/link";
import { memo } from "react";
// i18n-exempt — placeholder footer copy; upstream apps provide translations
const t = (s: string) => s;
import { cn } from "../../utils/style";

const Footer = memo(function Footer({
  height = "h-16",
  padding = "",
}: {
  height?: string;
  padding?: string;
}) {
  const FOOTER_CLASS = "flex items-center justify-center bg-muted text-sm text-muted"; // i18n-exempt: CSS classes only
  const COLOR_TOKEN = "--color-muted"; // i18n-exempt: design token name
  return (
    <footer
      className={cn(
        FOOTER_CLASS,
        height,
        padding
      )}
      data-token={COLOR_TOKEN}
    >
      {" "}
      <p className="space-x-4">
        <Link href="/legal/privacy" className="hover:underline">
          {t("Privacy")} {/* i18n-exempt: placeholder; host app provides translations */}
        </Link>
        <span>&middot;</span>
        {/* i18n-exempt: decorative separator */}
        <Link href="/legal/terms" className="hover:underline">
          {t("Terms")} {/* i18n-exempt: placeholder; host app provides translations */}
        </Link>
      </p>
    </footer>
  );
});

export default Footer;
