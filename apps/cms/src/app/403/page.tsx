// apps/cms/src/app/403/page.tsx

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "@acme/i18n";

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
  const href = shop ? `/cms/shop/${shop}/products` : "/products";
  const t = useTranslations();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-danger-foreground">{t("cms.errors.accessDenied.title")}</h1>
      <p className="text-muted-foreground text-sm">{t("cms.errors.accessDenied.message")}</p>
      <Link
        href={href}
        className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-primary-foreground"
      >
        {t("cms.errors.accessDenied.cta")}
      </Link>
    </div>
  );
}
