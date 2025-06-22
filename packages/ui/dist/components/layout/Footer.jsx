// src/components/layout/Footer.tsx
import Link from "next/link";
import { memo } from "react";
const Footer = memo(function Footer() {
    return (<footer className="h-16 flex items-center justify-center text-sm text-gray-500 bg-gray-100">
      <p className="space-x-4">
        <Link href="/legal/privacy" className="hover:underline">
          Privacy
        </Link>
        <span>&middot;</span>
        <Link href="/legal/terms" className="hover:underline">
          Terms
        </Link>
      </p>
    </footer>);
});
export default Footer;
