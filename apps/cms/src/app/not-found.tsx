import Link from "next/link";
import type { ReactElement } from "react";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

// This function must return a JSX element.
export default async function NotFound(): Promise<ReactElement> {
  const t = await getTranslations("en");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">{t("notFound.title")}</h1>
      <p className="text-muted-foreground text-sm">{t("notFound.desc")}</p>
      <Link
        href="/cms"
        className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-primary-foreground"
      >
        {t("notFound.back")}
      </Link>
    </div>
  );
}
