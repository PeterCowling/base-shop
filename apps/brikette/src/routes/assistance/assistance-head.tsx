import { type JSX } from "react";
import { type AppLanguage } from "@/i18n.config";
import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import type { LinksFunction, MetaFunction } from "react-router";
import enAssistanceSection from "@/locales/en/assistanceSection.json";

interface AssistanceHeadProps {
  lang: AppLanguage;
  title: string;
  desc: string;
  ogImage: string;
}

export function AssistanceHead({ lang: _lang, title: _title, desc: _desc }: AssistanceHeadProps): JSX.Element | null {
  // Head tags are handled via route meta()/links(); render nothing here.
  return null;
}

export default AssistanceHead;

// Provide meta()/links() to satisfy route head lint rules when this file is treated as a route file.
export const meta: MetaFunction = () => {
  const lang = "en" as AppLanguage;
  const path = `/${lang}/${getSlug("assistance", lang)}`;
  const url = `${BASE_URL}${path}`;
  const title =
    typeof enAssistanceSection?.meta?.title === "string" ? enAssistanceSection.meta.title : "";
  const description =
    typeof enAssistanceSection?.meta?.description === "string"
      ? enAssistanceSection.meta.description
      : "";
  return buildRouteMeta({
    lang,
    title,
    description,
    url,
    path,
  });
};

export const links: LinksFunction = () => buildRouteLinks();

