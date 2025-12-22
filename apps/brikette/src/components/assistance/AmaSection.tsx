import React, { Fragment } from "react";
import BaseAmaSection from "@acme/ui/organisms/AssistanceAmaSection";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSlug } from "@/utils/slug";
import { toAppLanguage } from "@/utils/lang";
import type { AppLanguage } from "@/i18n.config";

type Props = { lang?: AppLanguage } & Record<string, unknown>;

/*
 * Wrapper around the base AMA section to expose a simple, accessible
 * "read more" link used by smoke tests and basic navigation.
 * - Keeps the underlying UI intact
 * - Computes a locale-aware link to a canonical help article
 */
export default function AmaSection(props: Props) {
  const lang = toAppLanguage(props.lang);
  const { t } = useTranslation("assistanceSection", { lng: lang });
  const assistanceSlug = getSlug("assistance", lang);
  const linkHref = `/${lang}/${assistanceSlug}`;
  const linkLabel = t("amaHelpCenterLink", {
    defaultValue: "Browse all help articles",
  });
  return (
    <Fragment>
      {/* pass through all props to the base component */}
      <BaseAmaSection {...props} lang={lang} />
      <div className="mt-6 text-center">
        <Link
          to={linkHref}
          prefetch="intent"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:text-brand-secondary"
        >
          {linkLabel}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </Fragment>
  );
}

// Also provide a named export to preserve existing import styles
export { AmaSection };
