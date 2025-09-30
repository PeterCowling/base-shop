"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";
import { Button } from "../atoms/shadcn";

export interface Error404TemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** URL to navigate to when the user chooses to go back home. */
  homeHref?: string;
}

export function Error404Template({
  homeHref = "/",
  className,
  ...props
}: Error404TemplateProps) {
  const t = useTranslations();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-4 py-20 text-center", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        className
      )}
      {...props}
    >
      <h1 className="text-6xl font-bold">{t("error.404.code")}</h1>
      <p className="text-lg">{t("error.404.message")}</p>
      <Button onClick={() => (window.location.href = homeHref)}>{t("actions.goHome")}</Button>
    </div>
  );
}
