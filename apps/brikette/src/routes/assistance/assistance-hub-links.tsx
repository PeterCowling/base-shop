import type { JSX } from "react";
import { Link } from "react-router-dom";
import { Section } from "@acme/ui/atoms/Section";
import { ASSISTANCE_HUB_TEST_IDS } from "./constants";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";
import type { LinksFunction, MetaFunction } from "react-router";
import type { AppLanguage } from "@/i18n.config";
import enAssistanceSection from "@/locales/en/assistanceSection.json";

export interface HubLinkContent {
  eyebrow?: string;
  title: string;
  summary?: string;
  metaDescription?: string;
  href: string;
}

interface AssistanceHubLinksProps {
  heading: string;
  intro?: string;
  howTo: HubLinkContent;
  experiences: HubLinkContent;
}

const EMPTY_LINK: HubLinkContent = {
  title: "",
  href: "#",
};

export function AssistanceHubLinks({
  heading = "",
  intro,
  howTo = EMPTY_LINK,
  experiences = EMPTY_LINK,
}: AssistanceHubLinksProps): JSX.Element {
  return (
    <Section
      as="section"
      padding="none"
      className="mx-auto mt-12 w-full max-w-5xl px-4 sm:px-6 lg:px-8"
      data-testid={ASSISTANCE_HUB_TEST_IDS.section}
    >
      <div className="rounded-3xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/60">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-surface">{heading}</h2>
          {intro ? (
            <p className="text-brand-paragraph dark:text-brand-muted-dark text-pretty text-sm leading-relaxed">
              {intro}
            </p>
          ) : null}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            to={howTo.href}
            prefetch="intent"
            className="group flex h-full flex-col justify-between rounded-2xl border border-brand-outline/40 bg-brand-surface/80 p-5 text-start shadow-sm transition hover:border-brand-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:border-brand-outline/50 dark:bg-brand-text/10 dark:hover:border-brand-secondary/70 dark:focus-visible:ring-brand-secondary"
            data-testid={ASSISTANCE_HUB_TEST_IDS.howToLink}
          >
            <div>
              {howTo.eyebrow ? (
                <p className="text-brand-muted dark:text-brand-muted-dark text-xs font-semibold uppercase tracking-wide">
                  {howTo.eyebrow}
                </p>
              ) : null}
              <h3 className="mt-2 text-lg font-semibold text-brand-heading dark:text-brand-surface">
                {howTo.title}
              </h3>
              {howTo.summary ? (
                <p className="mt-3 text-brand-paragraph dark:text-brand-muted-dark text-pretty text-sm leading-relaxed">
                  {howTo.summary}
                </p>
              ) : null}
            </div>
          </Link>

          <Link
            to={experiences.href}
            prefetch="intent"
            className="group flex h-full flex-col justify-between rounded-2xl border border-brand-outline/40 bg-brand-surface/80 p-5 text-start shadow-sm transition hover:border-brand-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:border-brand-outline/50 dark:bg-brand-text/10 dark:hover:border-brand-secondary/70 dark:focus-visible:ring-brand-secondary"
            data-testid={ASSISTANCE_HUB_TEST_IDS.experiencesLink}
          >
            <div>
              {experiences.eyebrow ? (
                <p className="text-brand-muted dark:text-brand-muted-dark text-xs font-semibold uppercase tracking-wide">
                  {experiences.eyebrow}
                </p>
              ) : null}
              <h3 className="mt-2 text-lg font-semibold text-brand-heading dark:text-brand-surface">
                {experiences.title}
              </h3>
              {experiences.summary ? (
                <p className="mt-3 text-brand-paragraph dark:text-brand-muted-dark text-pretty text-sm leading-relaxed">
                  {experiences.summary}
                </p>
              ) : null}
            </div>
          </Link>
        </div>
      </div>
    </Section>
  );
}

export default AssistanceHubLinks;
export { ASSISTANCE_HUB_TEST_IDS };

// Provide meta()/links() to satisfy route head lint rules when this file is treated as a route file.
export const meta: MetaFunction = () => {
  const lang = "en" as AppLanguage;
  const path = `/${lang}/${getSlug("assistance", lang)}`;
  const url = `${BASE_URL}${path}`;
  return buildRouteMeta({
    lang,
    title:
      typeof enAssistanceSection?.meta?.title === "string"
        ? enAssistanceSection.meta.title
        : "",
    description:
      typeof enAssistanceSection?.meta?.description === "string"
        ? enAssistanceSection.meta.description
        : "",
    url,
    path,
  });
};

export const links: LinksFunction = () => {
  const lang = "en" as AppLanguage;
  const path = `/${lang}/${getSlug("assistance", lang)}`;
  return buildRouteLinks({ lang, path });
};
