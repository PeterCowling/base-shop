// apps/cms/src/app/403/page.tsx

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "@acme/i18n";
import { Chip } from "@ui/components/atoms";

export default function AccessDenied() {
  return (
    <Suspense fallback={null}>
      <AccessDeniedContent />
    </Suspense>
  );
}

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");
  const reason = searchParams.get("reason");
  const href = shop ? `/cms/shop/${shop}/products` : "/products";
  const t = useTranslations();

  const reasonCopy = (() => {
    if (!reason) return null;
    switch (reason) {
      case "manage_inventory":
        return "Missing permission: manage_inventory (default: admin, ShopAdmin)";
      case "manage_catalog":
        return "Missing permission: manage_catalog (default: admin, ShopAdmin, CatalogManager)";
      case "manage_media":
        return "Missing permission: manage_media (default: admin, ShopAdmin, CatalogManager)";
      case "uploads":
        return "Access to uploads requires catalog, inventory, or media permissions.";
      default:
        return null;
    }
  })();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-danger-foreground">{t("cms.errors.accessDenied.title")}</h1>
      <p className="text-muted-foreground text-sm">{t("cms.errors.accessDenied.message")}</p>
      {reasonCopy && (
        <Chip className="bg-muted px-3 py-1 text-xs text-muted-foreground" data-testid="403-reason-chip">
          {reasonCopy}
        </Chip>
      )}
      <Link
        href={href}
        className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-primary-foreground"
      >
        {t("cms.errors.accessDenied.cta")}
      </Link>
    </div>
  );
}
