"use client";
// src/components/layout/Footer.tsx
import { memo } from "react";
import Link from "next/link";

import { useTranslations } from "@acme/i18n";

import { cn } from "../../utils/style";

const Footer = memo(function Footer({
  height = "h-16",
  padding = "",
}: {
  height?: string;
  padding?: string;
}) {
  const t = useTranslations();
  const FOOTER_CLASS = "flex items-center justify-center bg-muted text-sm text-muted"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  const COLOR_TOKEN = "--color-muted"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
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
          {t("legal.privacy")} {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
        </Link>
        <span>&middot;</span>
        {/* i18n-exempt: decorative separator */}
        <Link href="/legal/terms" className="hover:underline">
          {t("legal.terms")} {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
        </Link>
      </p>
    </footer>
  );
});

export default Footer;
